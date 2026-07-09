'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../../client/supabaseClient';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, User, Phone, X, Check, MessageSquare, Timer, TimerOff } from 'lucide-react';

interface ServiceRequest {
  id: string;
  user_id: string;
  service_type: string;
  request_latitude: number;
  request_longitude: number;
  request_details: string | null;
  status: 'pending_notification' | 'notified_multiple' | 'accepted' | 'rejected' | 'cancelled' | 'completed' | 'error' | 'no_ustaz_found';
  created_at: string;
  notified_providers?: string[];
  accepted_by_provider_id?: string | null;
}

interface UserMetadata {
  id: string;
  name: string;
  email: string;
}

interface ProviderRequestNotificationProps {
  providerId: string;
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
  onOpenChat?: (userId: string, requestId: string) => void; // Callback to open chat
  acceptTimeoutSeconds?: number; // Countdown timeout before auto-reject (default 45)
}

const ProviderRequestNotification = ({
  providerId,
  onAccept,
  onReject,
  onOpenChat,
  acceptTimeoutSeconds = 45
}: ProviderRequestNotificationProps) => {
  const [activeRequests, setActiveRequests] = useState<ServiceRequest[]>([]);
  const [users, setUsers] = useState<Record<string, UserMetadata>>({});

  const [loading, setLoading] = useState(true);
  const [countdowns, setCountdowns] = useState<Record<string, number>>({});
  const [autoRejected, setAutoRejected] = useState<Record<string, boolean>>({});
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Show browser notification
  const showBrowserNotification = useCallback(async (title: string, options: NotificationOptions = {}) => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      new Notification(title, options);
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(title, options);
      }
    }
  }, []);

  // Load initial pending requests
  const loadInitialData = useCallback(async () => {
    try {
      const { data: serviceRequests, error } = await supabase
        .from('service_requests')
        .select('*')
        .contains('notified_providers', [providerId])
        .eq('status', 'notified_multiple')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (serviceRequests) {
        setActiveRequests(serviceRequests as ServiceRequest[]);
        const initialCountdowns: Record<string, number> = {};
        for (const req of serviceRequests) {
          const elapsed = Math.floor((Date.now() - new Date(req.created_at).getTime()) / 1000);
          const remaining = Math.max(0, acceptTimeoutSeconds - elapsed);
          if (remaining > 0) {
            initialCountdowns[req.id] = remaining;
          } else {
            setAutoRejected((ar) => ({ ...ar, [req.id]: true }));
            onReject(req.id);
          }
        }
        setCountdowns(initialCountdowns);
      }
    } catch (error: any) {
      console.error('Error loading initial requests:', error);
    } finally {
      setLoading(false);
    }
  }, [providerId, acceptTimeoutSeconds, onReject]);

  // Play an audio alert beep when a new request arrives
  const playBeep = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      [600, 800, 600].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.25);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.25 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.25);
        osc.stop(ctx.currentTime + i * 0.25 + 0.2);
      });
    } catch (e) {
      // Audio not available
    }
  }, []);

  // Countdown timer effect — decrements every second for each active request
  useEffect(() => {
    if (activeRequests.length === 0) return;
    const interval = setInterval(() => {
      setCountdowns((prev) => {
        const next: Record<string, number> = {};
        let changed = false;
        for (const [id, sec] of Object.entries(prev)) {
          if (sec <= 1) {
            setAutoRejected((ar) => ({ ...ar, [id]: true }));
            setActiveRequests((ars) => ars.filter((r) => r.id !== id));
            onReject(id);
            toast.info('Request timed out');
            changed = true;
          } else {
            next[id] = sec - 1;
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeRequests.length, onReject]);

  // Setup effect: load initial data + realtime subscriptions
  useEffect(() => {
    loadInitialData();

    const notificationsChannel = supabase
      .channel(`provider-${providerId}-notifications`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_user_id=eq.${providerId}`,
        },
        async (payload) => {
          const newNotification = payload.new;
          if (newNotification.status === 'pending' && newNotification.request_id) {
            const { data: serviceRequest, error } = await supabase
              .from('service_requests')
              .select('*')
              .eq('id', newNotification.request_id)
              .single();
            if (error) { console.error('Error fetching service request:', error); return; }
            if (serviceRequest && serviceRequest.status === 'notified_multiple') {
              setActiveRequests(prev =>
                prev.some(r => r.id === serviceRequest.id)
                  ? prev
                  : [...prev, serviceRequest as ServiceRequest]
              );
              setCountdowns((prev) => ({ ...prev, [serviceRequest.id]: acceptTimeoutSeconds }));
              playBeep();
              toast.success(`New ${serviceRequest.service_type} request!`, {
                description: serviceRequest.request_details || 'New service request received',
              });
              showBrowserNotification(`New ${serviceRequest.service_type} request!`, {
                body: serviceRequest.request_details || 'New service request received',
                icon: '/icon-192x192.png',
                tag: serviceRequest.id
              });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_user_id=eq.${providerId}`,
        },
        (payload) => {
          const updatedNotification = payload.new;
          if (updatedNotification.status === 'accepted' ||
              updatedNotification.status === 'rejected' ||
              updatedNotification.status === 'taken_by_other') {
            setActiveRequests(prev =>
              prev.filter(req => req.id !== updatedNotification.request_id)
            );
          }
        }
      )
      .subscribe();

    const serviceRequestsChannel = supabase
      .channel(`provider-${providerId}-service-requests-all`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'service_requests',
        },
        (payload) => {
          const updatedRequest = payload.new as ServiceRequest;
          setActiveRequests((currentReqs) => {
            const existingIndex = currentReqs.findIndex(req => req.id === updatedRequest.id);
            if (existingIndex !== -1) {
              if (updatedRequest.status === 'accepted') {
                const filtered = currentReqs.filter(req => req.id !== updatedRequest.id);
                if (updatedRequest.accepted_by_provider_id === providerId) {
                  toast.success('You have successfully accepted a service request!');
                  showBrowserNotification('Service Request Accepted', {
                    body: 'You have successfully accepted a service request!',
                    icon: '/icon-192x192.png',
                    tag: updatedRequest.id
                  });
                } else {
                  toast.info('Another provider has accepted this request');
                  showBrowserNotification('Request Taken', {
                    body: 'Another provider has accepted this request',
                    icon: '/icon-192x192.png',
                    tag: updatedRequest.id
                  });
                }
                return filtered;
              }
            }
            return currentReqs;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(serviceRequestsChannel);
    };
  }, [providerId, acceptTimeoutSeconds, loadInitialData, playBeep, showBrowserNotification]);

  const getUserInfo = async (userId: string) => {
    if (users[userId]) return users[userId];

    try {
      // Fetch user info from profiles table (created via trigger on auth.users insert)
      const { data: userData, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Error fetching user profile:', error);
      }

      if (userData) {
        const userInfo: UserMetadata = {
          id: userData.id,
          name: userData.full_name || 'Customer',
          email: userData.email || ''
        };
        setUsers(prev => ({ ...prev, [userId]: userInfo }));
        return userInfo;
      }

      // Fallback: return placeholder (no admin API call — admin.getUserById requires service_role key)
      return {
        id: userId,
        name: 'Customer',
        email: ''
      };
    } catch (error) {
      console.error('Error fetching user info:', error);
      return {
        id: userId,
        name: 'Customer',
        email: ''
      };
    }
  };

  const handleAccept = useCallback(async (requestId: string) => {
    // Optimistically remove the popup so the provider sees immediate feedback;
    // the realtime UPDATE will re-render the dashboard list with `accepted`.
    setActiveRequests((prev) => prev.filter((r) => r.id !== requestId));
    setCountdowns((prev) => { const n = {...prev}; delete n[requestId]; return n; });
    onAccept(requestId);
  }, [onAccept]);

  const handleReject = useCallback(async (requestId: string) => {
    setActiveRequests((prev) => prev.filter((r) => r.id !== requestId));
    setCountdowns((prev) => { const n = {...prev}; delete n[requestId]; return n; });
    onReject(requestId);
  }, [onReject]);

  // Cleanup audio context on unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="p-4">
        <p>Loading requests...</p>
      </div>
    );
  }

  if (activeRequests.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 space-y-3 z-50 max-w-sm w-full">
      {activeRequests.map((request) => (
        <Card key={request.id} className={`shadow-lg border-l-4 animate-slide-up ${
          countdowns[request.id] !== undefined && countdowns[request.id] <= 10
            ? 'border-red-500 ring-2 ring-red-200'
            : 'border-blue-500'
        }`}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg flex items-center">
                <User className="w-4 h-4 mr-2 text-blue-500" />
                New Request
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                {request.service_type}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 mb-3">
              <div className="flex items-center text-sm text-gray-600">
                <User className="w-4 h-4 mr-2" />
                <span>Customer: {request.user_id.substring(0, 8)}...</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2" />
                <span>Service: {request.service_type}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2" />
                <span>Location: {request.request_latitude.toFixed(4)}, {request.request_longitude.toFixed(4)}</span>
              </div>
              {request.request_details && (
                <div className="text-sm text-gray-600">
                  <p>Address: {request.request_details}</p>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="w-3 h-3 mr-1" />
                  <span>{new Date(request.created_at).toLocaleTimeString()}</span>
                </div>
                {countdowns[request.id] !== undefined && (
                  <div className={`flex items-center gap-1 text-xs font-mono font-bold ${
                    countdowns[request.id] <= 10 ? 'text-red-600 animate-pulse' : 'text-amber-600'
                  }`}>
                    <Timer className={`h-3 w-3 ${countdowns[request.id] <= 10 ? 'animate-pulse' : ''}`} />
                    <span>{countdowns[request.id]}s</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => handleAccept(request.id)}
              >
                <Check className="w-4 h-4 mr-1" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  // Open chat with the customer
                  if (onOpenChat) {
                    onOpenChat(request.user_id, request.id);
                  } else {
                    // Fallback to opening chat page directly
                    window.open(`/chat?with=${request.user_id}&request=${request.id}`, '_blank');
                  }
                }}
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                Chat
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => handleReject(request.id)}
              >
                <X className="w-4 h-4 mr-1" />
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProviderRequestNotification;