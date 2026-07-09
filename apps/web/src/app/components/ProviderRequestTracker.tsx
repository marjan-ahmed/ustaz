'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Clock,
  MapPin,
  Phone,
  MessageSquare,
  User as UserIcon,
  Navigation,
  AlertCircle,
  CheckCircle,
  Play,
  Package,
  Check
} from 'lucide-react';
import { toast } from 'sonner';

interface ServiceRequest {
  id: string;
  user_id: string;
  service_type: string;
  request_latitude: number;
  request_longitude: number;
  request_details: string | null;
  status: 'pending_notification' | 'notified_multiple' | 'accepted' | 'arriving' | 'in_progress' | 'rejected' | 'cancelled' | 'completed' | 'error' | 'no_ustaz_found';
  created_at: string;
  updated_at: string;
  notified_providers?: string[];
  accepted_by_provider_id?: string | null;
  address: string;
}

interface UserInfo {
  id: string;
  full_name: string;
  email: string;
  phone_country_code: string;
  phone_number: string;
  avatar_url?: string;
}

interface LiveLocation {
  latitude: number;
  longitude: number;
  updated_at: string;
}

interface ProviderRequestTrackerProps {
  providerId: string;
  requestId: string | null;
  onStatusChange?: (newStatus: string) => void;
}

const ProviderRequestTracker = ({
  providerId,
  requestId,
  onStatusChange
}: ProviderRequestTrackerProps) => {
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [distance, setDistance] = useState<number | null>(null);
  const [eta, setEta] = useState<number | null>(null); // in minutes

  // Define loadRequestData function first
  const loadRequestData = async () => {
    try {
      const { data, error } = await createClient()
        .from('service_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (error) throw error;

      setRequest(data as ServiceRequest);

      // Load user info if available
      if (data.user_id) {
        loadUserInfo(data.user_id);
      }
    } catch (error: any) {
      console.error('Error loading request data:', error);
      toast.error('Failed to load request data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!requestId) return;

    // Load initial request data
    loadRequestData();

    // Set up real-time subscription for request updates
    const supabase = createClient();
    const requestChannel = supabase
      .channel(`provider-request-updates-${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'service_requests',
          filter: `id=eq.${requestId}`,
        },
        (payload) => {
          const updatedRequest = payload.new as ServiceRequest;
          setRequest(updatedRequest);

          // Call parent callback when status changes
          if (onStatusChange && updatedRequest.status !== request?.status) {
            onStatusChange(updatedRequest.status);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(requestChannel);
    };
  }, [requestId, providerId, onStatusChange]);

  const loadUserInfo = async (userId: string) => {
    try {
      const { data, error } = await createClient()
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      setUser(data as UserInfo);
    } catch (error: any) {
      console.error('Error loading user info:', error);
      toast.error('Failed to load user information');
    }
  };

  // Function to update request status
  const updateRequestStatus = async (action: 'arriving' | 'in_progress' | 'completed') => {
    if (!requestId) return;

    try {
      const response = await fetch('/api/update-request-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          providerId,
          action
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update request status');
      }

      toast.success(`Request status updated to ${action}`);
    } catch (error: any) {
      console.error('Error updating request status:', error);
      toast.error(error.message || 'Failed to update request status');
    }
  };

  // Simple distance calculation using Haversine formula (in km)
  const calculateDistanceAndEta = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    // Check if coordinates are valid
    if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
      setDistance(null);
      setEta(null);
      return;
    }

    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distanceKm = R * c;

    setDistance(parseFloat(distanceKm.toFixed(2)));

    // Calculate ETA (assuming average speed of 30 km/h for service providers)
    const etaMinutes = (distanceKm / 30) * 60;
    setEta(Math.round(etaMinutes));
  };

  // Calculate distance when request and provider location are available
  useEffect(() => {
    if (request && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          calculateDistanceAndEta(
            position.coords.latitude,
            position.coords.longitude,
            request.request_latitude,
            request.request_longitude
          );
        },
        (error) => {
          console.error('Error getting current location:', error);
        }
      );
    }
  }, [request]);

  if (loading || !request) {
    return (
      <Card className="shadow-sm border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg">Service Request</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading request information...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-gray-200">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Service Request</CardTitle>
          <Badge
            className={
              request.status === 'accepted' ? 'bg-green-500' :
              request.status === 'arriving' ? 'bg-blue-500' :
              request.status === 'in_progress' ? 'bg-purple-500' :
              request.status === 'notified_multiple' ? 'bg-yellow-500' :
              request.status === 'completed' ? 'bg-teal-500' :
              request.status === 'cancelled' ? 'bg-red-500' :
              request.status === 'no_ustaz_found' ? 'bg-red-500' :
              'bg-gray-500'
            }
          >
            {request.status.replace(/_/g, ' ').toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16 border-2 border-gray-200">
              <AvatarImage src={user?.avatar_url || undefined} />
              <AvatarFallback className="bg-gray-200">
                {user?.full_name ? user.full_name.charAt(0) : '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">
                {user?.full_name || 'Customer'}
              </h3>
              <p className="text-sm text-gray-600">{request.service_type}</p>
              <div className="flex items-center space-x-2 mt-1">
                {request.status === 'accepted' && (
                  <Badge variant="outline" className="border-green-500 text-green-600">
                    Ready to start
                  </Badge>
                )}
                {request.status === 'arriving' && (
                  <Badge variant="outline" className="border-blue-500 text-blue-600">
                    On the way
                  </Badge>
                )}
                {request.status === 'in_progress' && (
                  <Badge variant="outline" className="border-purple-500 text-purple-600">
                    Service in progress
                  </Badge>
                )}
                {request.status === 'completed' && (
                  <Badge variant="outline" className="border-teal-500 text-teal-600">
                    Completed
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center text-sm text-gray-600 mb-1">
                <MapPin className="w-4 h-4 mr-2" />
                <span>Service Address</span>
              </div>
              <p className="text-sm font-medium">{request.address}</p>
            </div>

            {distance !== null && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center text-sm text-blue-600 mb-1">
                  <Navigation className="w-4 h-4 mr-2" />
                  <span>Distance</span>
                </div>
                <p className="text-sm font-medium">{distance} km</p>
              </div>
            )}

            {eta !== null && (
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center text-sm text-green-600 mb-1">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>ETA</span>
                </div>
                <p className="text-sm font-medium">{eta} min</p>
              </div>
            )}
          </div>

          <div className="flex space-x-3 pt-2">
            <Button className="flex-1 bg-green-600 hover:bg-green-700">
              <Phone className="w-4 h-4 mr-2" />
              Call
            </Button>
            <Button variant="outline" className="flex-1">
              <MessageSquare className="w-4 h-4 mr-2" />
              Message
            </Button>
          </div>

          {/* Action buttons based on request status */}
          {request.status === 'accepted' && (
            <div className="flex space-x-3 mt-2">
              <Button
                className="flex-1"
                onClick={() => updateRequestStatus('arriving')}
              >
                <Play className="w-4 h-4 mr-2" />
                Arriving
              </Button>
            </div>
          )}

          {(request.status === 'arriving' || request.status === 'accepted') && (
            <div className="flex space-x-3 mt-2">
              <Button
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                onClick={() => updateRequestStatus('in_progress')}
              >
                <Package className="w-4 h-4 mr-2" />
                Start Service
              </Button>
            </div>
          )}

          {request.status === 'in_progress' && (
            <div className="flex space-x-3 mt-2">
              <Button
                className="flex-1 bg-teal-600 hover:bg-teal-700"
                onClick={() => updateRequestStatus('completed')}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Complete Service
              </Button>
            </div>
          )}

          {(request.status === 'arriving' || request.status === 'in_progress') && (
            <div className="flex space-x-3 mt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={async () => {
                  if (!requestId) return;
                  try {
                    const response = await fetch('/api/update-request-status', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        requestId,
                        providerId,
                        action: 'cancelled'
                      }),
                    });

                    const result = await response.json();

                    if (!response.ok) {
                      throw new Error(result.error || 'Failed to cancel request');
                    }

                    toast.success('Request cancelled successfully');
                  } catch (error: any) {
                    console.error('Error cancelling request:', error);
                    toast.error(error.message || 'Failed to cancel request');
                  }
                }}
              >
                Cancel Service
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProviderRequestTracker;