import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, KeyboardAvoidingView, Platform, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/useAuth';
import { loadConversations, loadMessages, sendChatMessage, subscribeToChat, type ChatMessage, type Conversation } from '@/lib/ustaz-api';
import { supabase } from '@/lib/supabase';
import { Drift, EmptyState, FadeInUp, IsoServiceScene, PressableScale, Screen, Text } from '@/components/mobile-ui';
import { color, font, radius, space } from '@/theme/tokens';

const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 110 : 95;

interface OptimisticMessage extends ChatMessage { _pending?: boolean; }

export default function CustomerChatScreen() {
  const { user, loading: authLoading, isSignedIn } = useAuth();
  const params = useLocalSearchParams<{ peer?: string }>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<string | null>(params.peer ?? null);
  const [messages, setMessages] = useState<OptimisticMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const loadConvos = useCallback(async () => {
    if (!user) return;
    try { setConversations(await loadConversations(user.id, false)); } catch {}
  }, [user]);

  useEffect(() => { loadConvos(); }, [loadConvos]);

  useEffect(() => {
    const show = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hide = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const s = Keyboard.addListener(show, () => setKeyboardVisible(true));
    const h = Keyboard.addListener(hide, () => setKeyboardVisible(false));
    return () => { s.remove(); h.remove(); };
  }, []);

  useEffect(() => {
    if (params.peer && conversations.length > 0) setSelected(params.peer);
  }, [params.peer, conversations]);

  useEffect(() => {
    if (!selected || !user) return;
    setLoading(true);
    loadMessages(selected, user.id).then((data) => { setMessages(data); setLoading(false); }).catch(() => setLoading(false));
  }, [selected, user]);

  useEffect(() => {
    if (!selected || !user) return;
    const channel = subscribeToChat(user.id, (msg) => {
      const inThisChat = (msg.sender_id === user.id && msg.recipient_id === selected) || (msg.sender_id === selected && msg.recipient_id === user.id);
      if (!inThisChat) return;
      setMessages((prev) => {
        if (msg.sender_id === user.id) {
          const idx = prev.findIndex((m) => m._pending && m.message === msg.message && m.recipient_id === msg.recipient_id);
          if (idx >= 0) { const next = prev.slice(); next[idx] = { ...msg }; return next; }
        }
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });
    return () => { supabase.removeChannel(channel); };
  }, [selected, user]);

  async function handleSend() {
    if (!draft.trim() || !user || !selected || sending) return;
    const text = draft.trim();
    setDraft(''); setSending(true);
    const peer = conversations.find((c) => c.peerId === selected);
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    setMessages((prev) => [...prev, { id: tempId, sender_id: user.id, recipient_id: selected, message: text, created_at: new Date().toISOString(), _pending: true }]);
    try {
      const real = await sendChatMessage({ requestId: peer?.requestId, senderId: user.id, recipientId: selected, message: text });
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...real, _pending: false } : m)));
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setDraft(text);
    }
    setSending(false);
  }

  if (authLoading || !isSignedIn) return (
    <Screen bg={color.cream} edges={['top']}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={color.primary} /></View>
    </Screen>
  );

  const peer = conversations.find((c) => c.peerId === selected);
  const composerBottomPadding = keyboardVisible ? Math.max(insets.bottom, 8) : TAB_BAR_HEIGHT;

  if (!selected) {
    return (
      <Screen bg={color.cream} edges={['top']}>
        <FadeInUp>
          <View style={{ paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.sm }}>
            <Text variant="h1">Messages</Text>
          </View>
        </FadeInUp>
        {conversations.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl }}>
            <EmptyState
              illustration={<Drift distance={6}><IsoServiceScene size={140} variant="general" /></Drift>}
              title="No messages yet"
              subtitle="Chat with your provider after accepting a service request."
            />
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(c) => c.peerId}
            renderItem={({ item }) => (
              <PressableScale onPress={() => setSelected(item.peerId)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md, borderBottomWidth: 1, borderBottomColor: color.line }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: `${color.primary}15`, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontFamily: font.display, fontSize: 18, color: color.primary }}>{item.peerName?.charAt(0)?.toUpperCase() ?? 'U'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text variant="label" style={{ fontWeight: '700' }}>{item.peerName}</Text>
                    {item.lastAt && <Text variant="caption" tone="muted">{item.lastAt}</Text>}
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                    <Text variant="body" tone="muted" numberOfLines={1} style={{ flex: 1 }}>{item.lastMessage || 'Start a conversation'}</Text>
                    {item.unread > 0 && (
                      <View style={{ minWidth: 20, height: 20, borderRadius: 10, backgroundColor: color.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, marginLeft: 8 }}>
                        <Text style={{ fontFamily: font.body, fontSize: 11, fontWeight: '700', color: color.white }}>{item.unread}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </PressableScale>
            )}
          />
        )}
      </Screen>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.cream }} edges={['top']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.md, paddingVertical: space.sm, borderBottomWidth: 1, borderBottomColor: color.line, backgroundColor: color.cream }}>
        <PressableScale onPress={() => setSelected(null)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: color.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="arrow-back" size={18} color={color.ink} />
        </PressableScale>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: `${color.primary}15`, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: font.display, fontSize: 14, color: color.primary }}>{peer?.peerName?.charAt(0)?.toUpperCase() ?? 'U'}</Text>
        </View>
        <Text variant="h3">{peer?.peerName ?? 'Chat'}</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={color.primary} /></View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(m) => m.id}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            contentContainerStyle={{ padding: space.md, gap: space.sm }}
            renderItem={({ item }) => {
              const isMine = item.sender_id === user?.id;
              return (
                <FadeInUp distance={8} style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: '78%' }}>
                  <View style={{ borderRadius: radius.xl, borderTopRightRadius: isMine ? 4 : radius.xl, borderTopLeftRadius: isMine ? radius.xl : 4, backgroundColor: isMine ? color.primary : color.surfaceAlt, paddingHorizontal: space.md, paddingVertical: space.sm }}>
                    <Text style={{ fontFamily: font.body, fontSize: 14, color: isMine ? color.white : color.ink }}>{item.message}</Text>
                  </View>
                  <Text variant="caption" tone="muted" style={{ marginTop: 2, paddingHorizontal: 4 }}>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </FadeInUp>
              );
            }}
          />
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.md, paddingTop: space.sm, paddingBottom: composerBottomPadding, borderTopWidth: 1, borderTopColor: color.line, backgroundColor: color.cream }}>
          <TextInput
            value={draft} onChangeText={setDraft}
            placeholder="Type a message..." placeholderTextColor={color.line}
            style={{ flex: 1, minHeight: 40, borderRadius: 20, borderWidth: 1.5, borderColor: color.line, backgroundColor: color.surfaceAlt, paddingHorizontal: space.md, fontFamily: font.body, fontSize: 14, color: color.ink }}
            onSubmitEditing={handleSend} returnKeyType="send"
          />
          <PressableScale onPress={handleSend} disabled={!draft.trim() || sending}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: draft.trim() ? color.primary : color.line, alignItems: 'center', justifyContent: 'center' }}>
            {sending ? <ActivityIndicator color={color.white} size="small" /> : <Ionicons name="send" size={16} color={color.white} />}
          </PressableScale>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
