'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { supabase } from '../../../client/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Send,
  Phone,
  VideoIcon,
  MoreVertical,
  MapPin,
  Image as ImageIcon,
  Shield,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Message {
  id: string;
  booking_id: string;
  sender_id: string;
  message_text: string;
  message_type: 'text' | 'image' | 'location' | 'system';
  is_read: boolean;
  created_at: string;
  sender?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

interface ChatUser {
  user_id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  user_type: 'customer' | 'provider';
}

interface ChatSystemProps {
  bookingId: string;
  otherUser: ChatUser;
  className?: string;
}

export const ChatSystem: React.FC<ChatSystemProps> = ({
  bookingId,
  otherUser,
  className = ''
}) => {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Phone number masking
  const [maskedPhone, setMaskedPhone] = useState<string>('');

  useEffect(() => {
    if (bookingId) {
      fetchMessages();
      setupRealtimeSubscription();
      generateMaskedPhone();
    }
  }, [bookingId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          booking_id,
          sender_id,
          message_text,
          message_type,
          is_read,
          created_at,
          sender:sender_id(first_name, last_name, avatar_url)
        `)
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
      
      // Mark messages as read
      await markMessagesAsRead();
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load chat messages');
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel(`chat-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
          
          // Mark as read if not from current user
          if (newMessage.sender_id !== user?.id) {
            markMessageAsRead(newMessage.id);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const generateMaskedPhone = () => {
    // Generate a masked phone number for privacy
    const randomNumber = Math.floor(Math.random() * 9000) + 1000;
    setMaskedPhone(`+92-XXX-${randomNumber}`);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const markMessagesAsRead = async () => {
    try {
      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('booking_id', bookingId)
        .neq('sender_id', user?.id);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('id', messageId);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const sendMessage = async (messageText: string, messageType: 'text' | 'image' | 'location' = 'text') => {
    if (!messageText.trim() || !user?.id) return;

    setIsSending(true);

    try {
      // Check for phone number sharing and block it
      const phonePattern = /(\+92|0)\d{10}|\d{11}/g;
      const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      
      if (phonePattern.test(messageText) || emailPattern.test(messageText)) {
        toast.error('Sharing contact information is not allowed. Use the platform\'s calling feature instead.');
        return;
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          booking_id: bookingId,
          sender_id: user.id,
          message_text: messageText,
          message_type: messageType,
        })
        .select()
        .single();

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(newMessage);
  };

  const initiateMaskedCall = async () => {
    try {
      // This would integrate with Twilio or similar service to create a masked call
      const response = await fetch('/api/calls/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bookingId,
          calleeUserId: otherUser.user_id 
        }),
      });

      if (response.ok) {
        const { maskedNumber } = await response.json();
        toast.success(`Call initiated! Dial ${maskedNumber} to connect.`);
      } else {
        throw new Error('Failed to initiate call');
      }
    } catch (error) {
      console.error('Error initiating call:', error);
      toast.error('Failed to initiate call. Please try again.');
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isMyMessage = (senderId: string) => senderId === user?.id;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={otherUser.avatar_url} />
            <AvatarFallback>
              {otherUser.first_name[0]}{otherUser.last_name[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">
              {otherUser.first_name} {otherUser.last_name}
            </CardTitle>
            <CardDescription>
              <Badge variant="secondary" className="text-xs">
                {otherUser.user_type === 'provider' ? 'Service Provider' : 'Customer'}
              </Badge>
            </CardDescription>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={initiateMaskedCall}
            className="flex items-center gap-2"
          >
            <Phone className="h-4 w-4" />
            <span className="hidden sm:inline">Call {maskedPhone}</span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={initiateMaskedCall}>
                <Phone className="h-4 w-4 mr-2" />
                Voice Call
              </DropdownMenuItem>
              <DropdownMenuItem>
                <VideoIcon className="h-4 w-4 mr-2" />
                Video Call
              </DropdownMenuItem>
              <DropdownMenuItem>
                <MapPin className="h-4 w-4 mr-2" />
                Share Location
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Privacy Notice */}
        <div className="px-4 py-2 bg-blue-50 border-b flex items-center gap-2 text-sm text-blue-700">
          <Shield className="h-4 w-4" />
          <span>Your phone number is protected. Use platform calling features to stay safe.</span>
        </div>

        {/* Messages Container */}
        <div className="h-96 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>Start a conversation with your service provider</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  isMyMessage(message.sender_id) ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-3 py-2 ${
                    isMyMessage(message.sender_id)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.message_type === 'system' && (
                    <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">{message.message_text}</span>
                    </div>
                  )}
                  
                  {message.message_type === 'text' && (
                    <>
                      <p className="text-sm">{message.message_text}</p>
                      <p className={`text-xs mt-1 ${
                        isMyMessage(message.sender_id) ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {formatTime(message.created_at)}
                      </p>
                    </>
                  )}
                  
                  {message.message_type === 'location' && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">Location shared</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={isSending}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={isSending || !newMessage.trim()}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <AlertTriangle className="h-3 w-3" />
            <span>Sharing personal contact information is prohibited for your safety</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatSystem;