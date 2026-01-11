'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../client/supabaseClient';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, User, Phone, X, Check, MessageSquare } from 'lucide-react';

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
}

const ProviderRequestNotification = ({
  providerId,
  onAccept,
  onReject,
  onOpenChat
}: ProviderRequestNotificationProps) => {
  const [activeRequests, setActiveRequests] = useState<ServiceRequest[]>([]);
  const [users, setUsers] = useState<Record<string, UserMetadata>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Request notification permission early
    const requestNotificationPermission = async () => {
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    };
    requestNotificationPermission();

    // Load initial data
    loadInitialData();

    // Set up real-time subscription for notifications table
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

          // Check if this is a new service request notification
          if (newNotification.status === 'pending' && newNotification.request_id) {
            // Fetch the service request details
            const { data: serviceRequest, error } = await supabase
              .from('service_requests')
              .select('*')
              .eq('id', newNotification.request_id)
              .single();

            if (error) {
              console.error('Error fetching service request:', error);
              return;
            }

            if (serviceRequest && serviceRequest.status === 'notified_multiple') {
              setActiveRequests(prev => [...prev, serviceRequest as ServiceRequest]);

              // Show toast notification
              toast.success(`New ${serviceRequest.service_type} request!`, {
                description: serviceRequest.request_details || 'New service request received',
              });

              // Show browser notification (outside the app)
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

          // Handle notification status updates
          if (updatedNotification.status === 'accepted' ||
              updatedNotification.status === 'rejected' ||
              updatedNotification.status === 'taken_by_other') {
            // Remove the request from the active list as it's no longer pending
            setActiveRequests(prev =>
              prev.filter(req => req.id !== updatedNotification.request_id)
            );
          }
        }
      )
      .subscribe();

    // Also set up a subscription to service_requests table to catch status changes
    // This will help track when requests are accepted by any provider
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

          // Find if this request exists in our active requests
          const existingRequestIndex = activeRequests.findIndex(req => req.id === updatedRequest.id);

          if (existingRequestIndex !== -1) {
            // If the status has changed to accepted
            if (updatedRequest.status === 'accepted') {
              // Remove the request from active requests
              setActiveRequests(prev =>
                prev.filter(req => req.id !== updatedRequest.id)
              );

              // Check if this provider accepted the request
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
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(serviceRequestsChannel);
    };
  }, [providerId]);

  // Function to show browser notifications
  const showBrowserNotification = async (title: string, options: NotificationOptions = {}) => {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.log('Browser notifications are not supported');
      return;
    }

    // Check if permission is granted
    if (Notification.permission === 'granted') {
      // Show notification
      new Notification(title, options);
    } else if (Notification.permission !== 'denied') {
      // Request permission and then show notification
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(title, options);
      }
    }
  };

  const loadInitialData = async () => {
    try {
      // Fetch pending service requests for this provider
      const { data: serviceRequests, error } = await supabase
        .from('service_requests')
        .select('*')
        .contains('notified_providers', [providerId])
        .eq('status', 'notified_multiple')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (serviceRequests) {
        setActiveRequests(serviceRequests as ServiceRequest[]);
      }
    } catch (error: any) {
      console.error('Error loading initial requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserInfo = async (userId: string) => {
    if (users[userId]) return users[userId];

    try {
      // For security, we'll fetch user info from a server action or API route
      // rather than directly accessing auth admin (which requires special permissions)
      const { data: userData, error } = await supabase
        .from('profiles') // Assuming there's a profiles table with user info
        .select('id, full_name, email')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Error fetching user profile, using placeholder:', error);
        // Fallback to using auth info if profiles table doesn't exist
        const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(userId);

        if (authError || !user) {
          throw authError || new Error('User not found');
        }

        const userInfo: UserMetadata = {
          id: user.id,
          name: user.user_metadata?.name || user.email || 'Unknown User',
          email: user.email || 'No email'
        };

        setUsers(prev => ({ ...prev, [userId]: userInfo }));
        return userInfo;
      }

      const userInfo: UserMetadata = {
        id: userData.id,
        name: userData.full_name || 'Unknown User',
        email: userData.email || 'No email'
      };

      setUsers(prev => ({ ...prev, [userId]: userInfo }));
      return userInfo;
    } catch (error) {
      console.error('Error fetching user info:', error);
      return {
        id: userId,
        name: 'Unknown User',
        email: 'No email'
      };
    }
  };

  const handleAccept = async (requestId: string) => {
    onAccept(requestId);
  };

  const handleReject = async (requestId: string) => {
    onReject(requestId);
  };

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
        <Card key={request.id} className="shadow-lg border-l-4 border-blue-500 animate-slide-up">
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
                <span>User ID: {request.user_id.substring(0, 8)}...</span>
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
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="w-3 h-3 mr-1" />
                <span>{new Date(request.created_at).toLocaleTimeString()}</span>
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