import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@ustaz/shared/theme';
import { useAuth } from '@/lib/useAuth';
import { loadConversations, loadMessages, sendChatMessage, subscribeToChat, type ChatMessage, type Conversation } from '@/lib/ustaz-api';
import { supabase } from '@/lib/supabase';

const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 110 : 95;

interface OptimisticMessage extends ChatMessage {
  _pending?: boolean;
}

export default function ProviderChatScreen() {
  const { user, loading: authLoading, isSignedIn } = useAuth();
  const router = useRouter();
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
    try {
      const data = await loadConversations(user.id, true);
      setConversations(data);
    } catch {}
  }, [user]);

  useEffect(() => { loadConvos(); }, [loadConvos]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Auto-select peer from query param
  useEffect(() => {
    if (params.peer && conversations.length > 0) {
      setSelected(params.peer);
    }
  }, [params.peer, conversations]);

  useEffect(() => {
    if (!selected || !user) return;
    setLoading(true);
    loadMessages(selected, user.id).then((data) => { setMessages(data); setLoading(false); }).catch(() => setLoading(false));
  }, [selected, user]);

  // Realtime subscription
  useEffect(() => {
    if (!selected || !user) return;
    const channel = subscribeToChat(user.id, (msg) => {
      const inThisChat =
        (msg.sender_id === user.id && msg.recipient_id === selected) ||
        (msg.sender_id === selected && msg.recipient_id === user.id);
      if (!inThisChat) return;

      setMessages((prev) => {
        if (msg.sender_id === user.id) {
          const idx = prev.findIndex(
            (m) => m._pending && m.message === msg.message && m.recipient_id === msg.recipient_id,
          );
          if (idx >= 0) {
            const next = prev.slice();
            next[idx] = { ...msg };
            return next;
          }
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
    setDraft('');
    setSending(true);

    const peer = conversations.find((c) => c.peerId === selected);
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const optimistic: OptimisticMessage = {
      id: tempId,
      sender_id: user.id,
      recipient_id: selected,
      message: text,
      created_at: new Date().toISOString(),
      _pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const real = await sendChatMessage({ requestId: peer?.requestId, senderId: user.id, recipientId: selected, message: text });
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...real, _pending: false } : m)));
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setDraft(text);
    }
    setSending(false);
  }

  if (authLoading || !isSignedIn) return <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}><View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.primary} /></View></SafeAreaView>;

  const peer = conversations.find((c) => c.peerId === selected);
  const composerBottomPadding = keyboardVisible ? Math.max(insets.bottom, 8) : TAB_BAR_HEIGHT;

  // Conversation list view
  if (!selected) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
          <Text style={{ fontFamily: 'Anton', fontSize: 26, color: '#1B1B27' }}>Messages</Text>
        </View>
        {conversations.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <Ionicons name="chatbubbles-outline" size={48} color="#D1D5DB" />
            <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, color: '#9CA3AF', textAlign: 'center', marginTop: 12 }}>Chat with customers after accepting a service request.</Text>
          </View>
        ) : (
          <FlatList data={conversations} keyExtractor={(c) => c.peerId}
            renderItem={({ item }) => (
              <Pressable onPress={() => setSelected(item.peerId)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: `${colors.primary}15`, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontFamily: 'Anton', fontSize: 16, color: colors.primary }}>{item.peerName?.charAt(0)?.toUpperCase() ?? 'U'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: '#1B1B27' }}>{item.peerName}</Text>
                    {item.lastAt ? <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, color: '#9CA3AF' }}>{item.lastAt}</Text> : null}
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                    <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: '#6B7280' }} numberOfLines={1}>{item.lastMessage || 'Start a conversation'}</Text>
                    {item.unread > 0 && (
                      <View style={{ minWidth: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
                        <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, fontWeight: '700', color: '#FFFFFF' }}>{item.unread}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
            )}
          />
        )}
      </SafeAreaView>
    );
  }

  // Message thread view
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
        <Pressable onPress={() => setSelected(null)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="arrow-back" size={18} color="#374151" />
        </Pressable>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: `${colors.primary}15`, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: 'Anton', fontSize: 14, color: colors.primary }}>{peer?.peerName?.charAt(0)?.toUpperCase() ?? 'U'}</Text>
        </View>
        <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 15, fontWeight: '700', color: '#1B1B27' }}>{peer?.peerName ?? 'Chat'}</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.primary} /></View>
        ) : (
          <FlatList ref={flatListRef} data={messages} keyExtractor={(m) => m.id}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            contentContainerStyle={{ padding: 16, paddingBottom: 16, gap: 8 }}
            renderItem={({ item }) => {
              const isMine = item.sender_id === user?.id;
              return (
                <View style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: '78%' }}>
                  <View style={{ borderRadius: 16, borderTopRightRadius: isMine ? 4 : 16, borderTopLeftRadius: isMine ? 16 : 4, backgroundColor: isMine ? colors.primary : '#F3F4F6', paddingHorizontal: 14, paddingVertical: 10 }}>
                    <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, color: isMine ? '#FFFFFF' : '#1B1B27' }}>{item.message}</Text>
                  </View>
                  <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 10, color: '#9CA3AF', marginTop: 2, paddingHorizontal: 4 }}>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
              );
            }}
          />
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 10, paddingBottom: composerBottomPadding, borderTopWidth: 1, borderTopColor: '#F3F4F6', backgroundColor: '#FFFFFF' }}>
          <TextInput value={draft} onChangeText={setDraft} placeholder="Type a message..." placeholderTextColor="#D1D5DB"
            style={{ flex: 1, minHeight: 40, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB', paddingHorizontal: 16, fontFamily: 'AtkinsonHyperlegible', fontSize: 14, color: '#1B1B27' }}
            onSubmitEditing={handleSend} returnKeyType="send" />
          <Pressable onPress={handleSend} disabled={!draft.trim() || sending}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: draft.trim() ? colors.primary : '#D1D5DB', alignItems: 'center', justifyContent: 'center' }}>
            {sending ? <ActivityIndicator color="#FFF" size="small" /> : <Ionicons name="send" size={16} color="#FFFFFF" />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}




