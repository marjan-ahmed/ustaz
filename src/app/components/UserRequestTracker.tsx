'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../client/supabaseClient';
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
  AlertCircle
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
}

interface ProviderInfo {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  phoneCountryCode: string;
  service_type: string;
  city: string;
  country: string;
  avatarUrl: string | null;
  experienceYears: number | null;
  experienceDetails: string | null;
}

interface LiveLocation {
  latitude: number;
  longitude: number;
  updated_at: string;
}

interface UserRequestTrackerProps {
  userId: string;
  requestId: string | null;
  onProviderAccepted: (providerId: string) => void;
  onProviderRejected: () => void;
  onNoProvidersFound: () => void;
  onLiveLocationUpdate?: (location: LiveLocation | null) => void;
}

const UserRequestTracker = ({
  userId,
  requestId,
  onProviderAccepted,
  onProviderRejected,
  onNoProvidersFound,
  onLiveLocationUpdate
}: UserRequestTrackerProps) => {
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [provider, setProvider] = useState<ProviderInfo | null>(null);
  const [liveLocation, setLiveLocation] = useState<LiveLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [distance, setDistance] = useState<number | null>(null);
  const [eta, setEta] = useState<number | null>(null); // in minutes

  // Define loadRequestData function first
  const loadRequestData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (error) throw error;

      setRequest(data as ServiceRequest);

      if (data.status === 'accepted' && data.accepted_by_provider_id) {
        loadProviderInfo(data.accepted_by_provider_id);
        onProviderAccepted(data.accepted_by_provider_id);
      }
    } catch (error: any) {
      console.error('Error loading request data:', error);
      toast.error('Failed to load request data');
    } finally {
      setLoading(false);
    }
  }, [requestId, onProviderAccepted, supabase]);

  // Load initial request data on mount
  useEffect(() => {
    if (requestId) {
      loadRequestData();
    }
  }, [requestId, loadRequestData]);

  // Function to show browser notifications
  const showBrowserNotification = useCallback(async (title: string, options: NotificationOptions = {}) => {
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
  }, []);

  useEffect(() => {
    if (request?.accepted_by_provider_id && requestId) {
      // Set up live location tracking subscription
      const locationChannel = supabase
        .channel(`live-location-${requestId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'live_locations',
            filter: `request_id=eq.${requestId}`,
          },
          (payload) => {
            const locationData = payload.new as LiveLocation;
            setLiveLocation(locationData);

            // Call parent callback to update live location if it exists
            if (onLiveLocationUpdate) {
              onLiveLocationUpdate(locationData);
            }

            // Calculate distance and ETA
            calculateDistanceAndEta(
              locationData.latitude,
              locationData.longitude,
              request.request_latitude,
              request.request_longitude
            );
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(locationChannel);
      };
    }
  }, [request?.accepted_by_provider_id, requestId, request?.request_latitude, request?.request_longitude, onLiveLocationUpdate]);

  const loadProviderInfo = useCallback(async (providerId: string) => {
    try {
      const { data, error } = await supabase
        .from('ustaz_registrations')
        .select('*')
        .eq('userId', providerId)
        .single();

      if (error) throw error;

      setProvider(data as ProviderInfo);
    } catch (error: any) {
      console.error('Error loading provider info:', error);
      toast.error('Failed to load provider information');
    }
  }, [supabase]);

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

  if (loading || !request) {
    return (
      <Card className="shadow-sm border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg">Request Status</CardTitle>
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
        {request.status === 'no_ustaz_found' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-700 font-medium">No providers found nearby</p>
            </div>
          </div>
        )}

        {provider && (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16 border-2 border-gray-200">
                <AvatarImage src={provider.avatarUrl || undefined} />
                <AvatarFallback className="bg-gray-200">
                  {provider.firstName.charAt(0)}
                  {provider.lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">
                  {provider.firstName} {provider.lastName}
                </h3>
                <p className="text-sm text-gray-600">{provider.service_type}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="secondary">
                    {provider.experienceYears} years experience
                  </Badge>
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
                  <span>Location</span>
                </div>
                <p className="text-sm font-medium">{provider.city}, {provider.country}</p>
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

            <div className="flex flex-col space-y-2 pt-2">
              <div className="flex space-x-3">
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
              {(request.status === 'arriving' || request.status === 'in_progress') && (
                <div className="flex space-x-3 mt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={async () => {
                      if (!requestId) return;
                      try {
                        const { data, error } = await supabase.rpc('cancel_service_request', {
                          p_request_id: requestId,
                          p_user_id: userId
                        });

                        if (error) throw error;

                        if (data && data[0]?.success) {
                          toast.success('Request cancelled successfully');
                        } else {
                          toast.error(data?.[0]?.message || 'Failed to cancel request');
                        }
                      } catch (error: any) {
                        console.error('Error cancelling request:', error);
                        toast.error('Failed to cancel request');
                      }
                    }}
                  >
                    Cancel Request
                  </Button>
                </div>
              )}

              {request.status === 'completed' && (
                <div className="flex space-x-3 mt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      // Could trigger a rating modal or feedback form
                      toast.info('Rating feature would be implemented here');
                    }}
                  >
                    Rate Provider
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {!provider && (
          <div className="text-center py-4">
            <p className="text-gray-600">
              {request.status === 'notified_multiple'
                ? 'Waiting for provider to accept your request...'
                : request.status === 'accepted'
                ? 'Loading provider information...'
                : 'No provider assigned yet'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserRequestTracker;