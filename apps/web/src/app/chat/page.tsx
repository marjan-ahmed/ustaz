'use client';

import { useState, useEffect } from 'react';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ChatComponent from '../components/ChatComponent';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function ChatPage() {
  const { user, isLoaded, isSignedIn } = useSupabaseUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const otherUserId = searchParams.get('with');
  const requestId = searchParams.get('request');

  const [otherUserInfo, setOtherUserInfo] = useState<{ name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.push('/auth/login');
      return;
    }

    if (!otherUserId) {
      router.push('/dashboard');
      return;
    }

    // Load other user's info
    const loadOtherUserInfo = async () => {
      try {
        const response = await fetch(`/api/users/${otherUserId}`);
        if (response.ok) {
          const userData = await response.json();
          setOtherUserInfo({ name: userData.name || 'User' });
        } else {
          setOtherUserInfo({ name: 'User' });
        }
      } catch (error) {
        console.error('Error loading user info:', error);
        setOtherUserInfo({ name: 'User' });
      } finally {
        setLoading(false);
      }
    };

    loadOtherUserInfo();
  }, [isLoaded, isSignedIn, otherUserId, router]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#db4b0d]"></div>
        <span className="ml-4 text-gray-700">Loading chat...</span>
      </div>
    );
  }

  if (!isSignedIn || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden p-8 md:p-10 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">Please sign in to access the chat.</p>
          <Button asChild className="bg-[#db4b0d] hover:bg-[#a93a0b] text-white px-6 py-3 rounded-xl font-semibold">
            <a href="/auth/login">Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  if (!otherUserId) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#db4b0d] to-orange-600 text-white">
              <CardTitle className="text-xl">
                Chat Messages
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Chat</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Select a conversation from your dashboard or service requests to start chatting with users.
                </p>
                <div className="space-y-3">
                  <Button asChild className="bg-[#db4b0d] hover:bg-[#a93a0b] text-white px-6 py-3 rounded-xl font-semibold">
                    <a href="/dashboard">Go to Dashboard</a>
                  </Button>
                  <p className="text-sm text-gray-500 mt-4">
                    You'll be redirected to the dashboard in a moment if you came here directly.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#db4b0d] to-orange-600 text-white">
              <CardTitle className="text-xl">
                Chat with {otherUserInfo?.name || 'User'}
                {requestId && (
                  <span className="text-sm ml-2 bg-white bg-opacity-20 px-2 py-1 rounded">
                    Request #{requestId.substring(0, 8)}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[600px]">
                <ChatComponent
                  currentUserId={user.id}
                  otherUserId={otherUserId}
                  currentUserName={user.user_metadata?.name || 'You'}
                  otherUserName={otherUserInfo?.name || 'User'}
                  onClose={() => router.back()}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </>
  );
}