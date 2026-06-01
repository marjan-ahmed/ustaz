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
  _pending?: boolean;
  _tempId?: string;
}

interface ChatComponentProps {
  currentUserId: string;
  otherUserId: string;
  currentUserName?: string;
  otherUserName?: string;
  onClose: () => void;
}

const nameCache = new Map<string, string>();

/* ── Shared bubble renderer ─────────────────────────────────────────────── */
function Bubble({
  msg,
  mine,
  stacked,
}: {
  msg: Message;
  mine: boolean;
  stacked: boolean;
}) {
  const time = new Date(msg.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  /* WhatsApp-style radii: tail corner gets a tighter radius */
  const radius = stacked
    ? 'rounded-2xl'
    : mine
    ? 'rounded-tl-2xl rounded-bl-2xl rounded-tr-2xl rounded-br-[5px]'
    : 'rounded-tr-2xl rounded-br-2xl rounded-tl-2xl rounded-bl-[5px]';

  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'} ${stacked ? 'mt-0.5' : 'mt-2'}`}>
      <div
        className={[
          'max-w-[78%] px-3.5 pt-2 pb-1.5 shadow-sm',
          radius,
          mine
            ? 'bg-[#d9fdd3] text-gray-900'        /* WhatsApp sent green */
            : 'bg-white text-gray-900 shadow-[0_1px_2px_rgba(0,0,0,0.12)]',  /* received white */
        ].join(' ')}
      >
        <p className="text-[15px] leading-snug whitespace-pre-wrap break-words">
          {msg.message}
        </p>

        {/* time + tick row */}
        <div className={`flex items-center gap-1 mt-0.5 ${mine ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[11px] text-gray-400 leading-none">{time}</span>
          {mine && (
            msg._pending
              ? <Clock className="w-3 h-3 text-gray-400" />
              : <CheckCheck className="w-3 h-3 text-[#53bdeb]" /> /* WhatsApp blue double-tick */
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────────────── */
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

  const channelName = useMemo(
    () => `chat:${[currentUserId, otherUserId].sort().join(':')}`,
    [currentUserId, otherUserId],
  );

  const scrollToBottom = useCallback((instant = false) => {
    endRef.current?.scrollIntoView({ behavior: instant ? 'auto' : 'smooth', block: 'end' });
  }, []);

  const onScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  }, []);

  /* initial load */
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
        if (error) { toast.error('Failed to load chat'); return; }
        setMessages((data ?? []) as Message[]);
        requestAnimationFrame(() => scrollToBottom(true));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [currentUserId, otherUserId, scrollToBottom]);

  /* realtime subscription */
  useEffect(() => {
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        const row = payload.new as Message;
        const inThisChat =
          (row.sender_id === currentUserId && row.recipient_id === otherUserId) ||
          (row.sender_id === otherUserId && row.recipient_id === currentUserId);
        if (!inThisChat) return;

        setMessages((prev) => {
          if (row.sender_id === currentUserId) {
            const idx = prev.findIndex(
              (m) => m._pending && m.message === row.message && m.recipient_id === row.recipient_id,
            );
            if (idx >= 0) {
              const next = prev.slice();
              next[idx] = { ...row };
              return next;
            }
          }
          if (prev.some((m) => m.id === row.id)) return prev;
          return [...prev, row];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [channelName, currentUserId, otherUserId]);

  /* auto-scroll */
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

    setMessages((prev) => [...prev, optimistic]);
    setDraft('');
    setSending(true);
    nearBottomRef.current = true;
    inputRef.current?.focus();

    const { error } = await supabase
      .from('chat_messages')
      .insert({ sender_id: currentUserId, recipient_id: otherUserId, message: text });

    setSending(false);

    if (!error) {
      fetch('/api/chat/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: otherUserId, preview: text }),
      }).catch(() => {});
    }

    if (error) {
      setMessages((prev) => prev.filter((m) => m._tempId !== tempId));
      setDraft((d) => (d ? d : text));
      if (error.code === '42501') {
        toast.error("You can only chat with someone you're actively engaged with.");
      } else {
        toast.error('Could not send. Tap to retry.');
      }
    }
  }, [draft, sending, currentUserId, otherUserId]);

  useEffect(() => {
    nameCache.set(currentUserId, currentUserName);
    nameCache.set(otherUserId, otherUserName);
  }, [currentUserId, otherUserId, currentUserName, otherUserName]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-md h-[85vh] sm:h-[600px] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header — brand orange, like the rest of the app */}
        <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[#db4b0d] to-orange-500 text-white shrink-0">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg shrink-0">
            {otherUserName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-[15px] truncate leading-tight">{otherUserName}</h3>
            <p className="text-[11px] text-white/80 flex items-center gap-1 leading-tight">
              <span className="w-1.5 h-1.5 bg-green-300 rounded-full" />
              In active service
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition shrink-0"
            aria-label="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages — WhatsApp wallpaper tint */}
        <div
          ref={listRef}
          onScroll={onScroll}
          className="flex-1 overflow-y-auto px-3 py-3"
          style={{ background: '#efeae2' }}
        >
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span className="text-sm">Loading…</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="bg-white/80 rounded-2xl px-5 py-4 shadow-sm max-w-[220px]">
                <p className="text-[13px] text-gray-500 leading-relaxed">
                  No messages yet.<br />Say hi 👋
                </p>
              </div>
            </div>
          ) : (
            <div className="pb-1">
              {messages.map((msg, i) => {
                const mine = msg.sender_id === currentUserId;
                const prev = messages[i - 1];
                const stacked = Boolean(prev && prev.sender_id === msg.sender_id);
                return <Bubble key={msg.id} msg={msg} mine={mine} stacked={stacked} />;
              })}
              <div ref={endRef} />
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="shrink-0 bg-[#f0f2f5] px-3 py-2.5 border-t border-gray-200">
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => { e.preventDefault(); void sendMessage(); }}
          >
            <Input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendMessage(); }
              }}
              placeholder="Type a message…"
              className="flex-1 h-11 rounded-full px-4 bg-white border-transparent shadow-sm focus-visible:ring-0 focus-visible:border-gray-300 text-[15px]"
              autoFocus
            />
            <Button
              type="submit"
              disabled={!draft.trim() || sending}
              className="h-11 w-11 p-0 rounded-full bg-[#25d366] hover:bg-[#1ebe5d] disabled:opacity-50 disabled:bg-gray-300 shrink-0 transition-colors"
              aria-label="Send"
            >
              {sending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4 text-white" />}
            </Button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default ChatComponent;
