'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../../client/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  created_at: string;
  sender_name?: string;
}

interface ChatComponentProps {
  currentUserId: string;
  otherUserId: string;
  currentUserName?: string;
  otherUserName?: string;
  onClose: () => void;
}

const ChatComponent: React.FC<ChatComponentProps> = ({
  currentUserId,
  otherUserId,
  currentUserName = 'You',
  otherUserName = 'Provider',
  onClose
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Memoize the function to get sender name to avoid dependency issues
  const getSenderName = useCallback((senderId: string) => {
    if (senderId === currentUserId) {
      return currentUserName || 'You';
    }
    return 'User'; // We'll fetch the actual name asynchronously when needed
  }, [currentUserId, currentUserName]);

  // Load existing messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${currentUserId})`)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error loading messages:', error);
          toast.error('Failed to load messages');
          return;
        }

        // Fetch sender names for the messages
        const messagesWithNames = await Promise.all(
          (data || []).map(async (message) => {
            // Determine if the sender is current user or other user
            const senderId = message.sender_id;
            if (senderId === currentUserId) {
              return { ...message, sender_name: getSenderName(senderId) };
            } else {
              // Fetch the sender's name from the API
              try {
                const response = await fetch(`/api/users/${senderId}`);
                if (response.ok) {
                  const userData = await response.json();
                  return { ...message, sender_name: userData.name || 'User' };
                } else {
                  return { ...message, sender_name: 'User' };
                }
              } catch (err) {
                console.error('Error fetching sender name:', err);
                return { ...message, sender_name: 'User' };
              }
            }
          })
        );

        setMessages(messagesWithNames);
      } catch (error) {
        console.error('Error loading messages:', error);
        toast.error('An unexpected error occurred while loading messages');
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [currentUserId, otherUserId, getSenderName]);

  // Subscribe to new messages
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${[currentUserId, otherUserId].sort().join('-')}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `and(or(sender_id.eq.${currentUserId},recipient_id.eq.${currentUserId}),or(sender_id.eq.${otherUserId},recipient_id.eq.${otherUserId}))`,
        },
        async (payload) => {
          const newMessage = payload.new as Message;

          // Fetch the sender's name for the new message
          if (newMessage.sender_id === currentUserId) {
            // For current user, we can use the local function
            setMessages(prev => [...prev, { ...newMessage, sender_name: getSenderName(newMessage.sender_id) }]);
          } else {
            // For other user, fetch from API
            try {
              const response = await fetch(`/api/users/${newMessage.sender_id}`);
              if (response.ok) {
                const userData = await response.json();
                setMessages(prev => [...prev, { ...newMessage, sender_name: userData.name || 'User' }]);
              } else {
                setMessages(prev => [...prev, { ...newMessage, sender_name: 'User' }]);
              }
            } catch (err) {
              console.error('Error fetching sender name for new message:', err);
              setMessages(prev => [...prev, { ...newMessage, sender_name: 'User' }]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, otherUserId, getSenderName]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    // Validate user IDs before attempting to send message
    if (!currentUserId || !otherUserId) {
      console.error('Missing user IDs for chat');
      toast.error('Unable to send message: Missing user information');
      return;
    }

    // Additional validation - check if both users exist in the system
    try {
      // Check if the other user exists (either in profiles or ustaz_registrations)
      const otherUserResponse = await fetch(`/api/users/${otherUserId}`);
      if (!otherUserResponse.ok) {
        toast.error('Cannot send message: Recipient does not exist');
        return;
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          sender_id: currentUserId,
          recipient_id: otherUserId,
          message: newMessage.trim(),
        });

      if (error) {
        console.error('Error sending message:', error);
        // Show a user-friendly error message
        if (error.code === '23503' || error.message.includes('does not exist')) {
          // Foreign key constraint violation or custom validation error
          console.error('One or both user IDs do not exist in the system');
          toast.error('Cannot send message: Invalid user account');
        } else if (error.code === '42501') {
          // RLS policy violation
          console.error('You do not have permission to send messages to this user');
          toast.error('You do not have permission to send messages to this user');
        } else {
          console.error('Database error:', error.message);
          toast.error('Failed to send message. Please try again.');
        }
        return;
      }

      setNewMessage('');
    } catch (error: any) {
      console.error('Unexpected error sending message:', error);
      toast.error('An unexpected error occurred. Please try again.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md h-[600px] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Chat with {otherUserName}</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto" style={{ maxHeight: '400px' }}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p>Loading messages...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs p-3 rounded-lg ${
                      msg.sender_id === currentUserId
                        ? 'bg-blue-500 text-white rounded-br-none'
                        : 'bg-gray-200 text-gray-800 rounded-bl-none'
                    }`}
                  >
                    <p>{msg.message}</p>
                    <p
                      className={`text-xs mt-1 ${
                        msg.sender_id === currentUserId ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button onClick={sendMessage} disabled={!newMessage.trim()}>
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;