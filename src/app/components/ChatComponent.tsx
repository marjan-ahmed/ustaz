'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '../../../client/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Send, X, Loader2, CheckCheck, Clock } from 'lucide-react';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  created_at: string;
  /** Client-side flag for optimistic messages awaiting server ack */
  _pending?: boolean;
  /** Stable client tempId so we can swap optimistic → confirmed */
  _tempId?: string;
}

interface ChatComponentProps {
  currentUserId: string;
  otherUserId: string;
  currentUserName?: string;
  otherUserName?: string;
  onClose: () => void;
}

// In-memory cache so we don't refetch names per render or per message
const nameCache = new Map<string, string>();

const ChatComponent: React.FC<ChatComponentProps> = ({
  currentUserId,
  otherUserId,
  currentUserName = 'You',
  otherUserName = 'Provider',
  onClose,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nearBottomRef = useRef(true);

  // Stable channel name so both peers always join the same channel
  const channelName = useMemo(
    () => `chat:${[currentUserId, otherUserId].sort().join(':')}`,
    [currentUserId, otherUserId],
  );

  // Snap to bottom — instant feels snappier in chat than smooth
  const scrollToBottom = useCallback((instant = false) => {
    endRef.current?.scrollIntoView({ behavior: instant ? 'auto' : 'smooth', block: 'end' });
  }, []);

  // Track whether the user is near the bottom — only auto-scroll if they are
  const onScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  }, []);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('id, sender_id, recipient_id, message, created_at')
          .or(
            `and(sender_id.eq.${currentUserId},recipient_id.eq.${otherUserId}),` +
            `and(sender_id.eq.${otherUserId},recipient_id.eq.${currentUserId})`,
          )
          .order('created_at', { ascending: true })
          .limit(200);

        if (cancelled) return;
        if (error) {
          console.error('[chat] load failed', error);
          toast.error('Failed to load chat');
          return;
        }
        setMessages((data ?? []) as Message[]);
        // After paint, snap to bottom
        requestAnimationFrame(() => scrollToBottom(true));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [currentUserId, otherUserId, scrollToBottom]);

  // Realtime subscription — no broken `and(or(...))` filter.
  // RLS gates which rows we actually receive, so this is safe.
  useEffect(() => {
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const row = payload.new as Message;
          // Defensive client filter (RLS should already block, but cheap to verify)
          const inThisChat =
            (row.sender_id === currentUserId && row.recipient_id === otherUserId) ||
            (row.sender_id === otherUserId && row.recipient_id === currentUserId);
          if (!inThisChat) return;

          setMessages((prev) => {
            // Reconcile our own optimistic message: drop pending dupe of same content
            if (row.sender_id === currentUserId) {
              const optimisticIdx = prev.findIndex(
                (m) => m._pending && m.message === row.message && m.recipient_id === row.recipient_id,
              );
              if (optimisticIdx >= 0) {
                const next = prev.slice();
                next[optimisticIdx] = { ...row };
                return next;
              }
            }
            // Skip exact-id duplicates (e.g. second subscribe cycle)
            if (prev.some((m) => m.id === row.id)) return prev;
            return [...prev, row];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelName, currentUserId, otherUserId]);

  // Auto-scroll on new message, only if user was already near bottom
  useEffect(() => {
    if (nearBottomRef.current) scrollToBottom();
  }, [messages.length, scrollToBottom]);

  const sendMessage = useCallback(async () => {
    const text = draft.trim();
    if (!text || sending) return;

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const optimistic: Message = {
      id: tempId,
      sender_id: currentUserId,
      recipient_id: otherUserId,
      message: text,
      created_at: new Date().toISOString(),
      _pending: true,
      _tempId: tempId,
    };

    // Optimistic insert — INSTANT feedback (no precheck round-trip)
    setMessages((prev) => [...prev, optimistic]);
    setDraft('');
    setSending(true);
    nearBottomRef.current = true; // we just sent, scroll us down
    inputRef.current?.focus();

    const { error } = await supabase
      .from('chat_messages')
      .insert({ sender_id: currentUserId, recipient_id: otherUserId, message: text });

    setSending(false);

    if (!error) {
      // Fire-and-forget push notification to the recipient
      fetch('/api/chat/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: otherUserId, preview: text }),
      }).catch(() => {});
    }

    if (error) {
      // Roll back optimistic on failure
      setMessages((prev) => prev.filter((m) => m._tempId !== tempId));
      // Restore draft so the user doesn't lose their message
      setDraft((d) => (d ? d : text));
      console.error('[chat] send failed', error);
      if (error.code === '42501') {
        toast.error("You can only chat with someone you're actively engaged with.");
      } else {
        toast.error('Could not send. Tap to retry.');
      }
    }
  }, [draft, sending, currentUserId, otherUserId]);

  // Eager-cache participants' names (purely for header / nice-to-have)
  useEffect(() => {
    nameCache.set(currentUserId, currentUserName);
    nameCache.set(otherUserId, otherUserName);
  }, [currentUserId, otherUserId, currentUserName, otherUserName]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md h-[80vh] sm:h-[600px] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-[#db4b0d] to-orange-500 text-white">
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-base truncate leading-tight">{otherUserName}</h3>
            <p className="text-[11px] text-white/80 leading-tight">In active service</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition"
            aria-label="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div
          ref={listRef}
          onScroll={onScroll}
          className="flex-1 overflow-y-auto px-4 py-4 bg-gradient-to-b from-orange-50/30 via-white to-white"
        >
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span className="text-sm">Loading chat…</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 px-6">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-3">
                <Send className="w-5 h-5 text-[#db4b0d]" />
              </div>
              <p className="text-sm">No messages yet. Say hi 👋</p>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((msg, i) => {
                const mine = msg.sender_id === currentUserId;
                const prev = messages[i - 1];
                const stacked = prev && prev.sender_id === msg.sender_id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${mine ? 'justify-end' : 'justify-start'} ${stacked ? 'mt-0.5' : 'mt-2'}`}
                  >
                    <div
                      className={`group max-w-[78%] px-3.5 py-2 shadow-sm ${
                        mine
                          ? `bg-[#db4b0d] text-white ${stacked ? 'rounded-2xl rounded-tr-md' : 'rounded-2xl rounded-br-md'}`
                          : `bg-white border border-gray-200 text-gray-900 ${stacked ? 'rounded-2xl rounded-tl-md' : 'rounded-2xl rounded-bl-md'}`
                      }`}
                    >
                      <p className="text-[15px] leading-snug whitespace-pre-wrap break-words">
                        {msg.message}
                      </p>
                      <div
                        className={`flex items-center gap-1 mt-1 text-[10px] ${
                          mine ? 'text-white/80 justify-end' : 'text-gray-400'
                        }`}
                      >
                        <span>
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                        {mine && (msg._pending ? <Clock className="w-3 h-3" /> : <CheckCheck className="w-3 h-3" />)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-gray-100 bg-white px-3 py-2.5">
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage();
            }}
          >
            <Input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
              placeholder="Type a message…"
              className="flex-1 h-11 rounded-full px-4 bg-gray-50 border-gray-200 focus-visible:ring-[#db4b0d]/40"
              autoFocus
            />
            <Button
              type="submit"
              disabled={!draft.trim() || sending}
              className="h-11 w-11 p-0 rounded-full bg-[#db4b0d] hover:bg-[#a93a0b] disabled:opacity-50 shrink-0"
              aria-label="Send message"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;
