'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/client';
import MapComponent from './MapComponent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Navigation, Clock, MapPin, Phone, MessageSquare } from 'lucide-react';
import { calculateDistance, calculateETA } from '@/lib/utils';

interface LiveLocation {
  latitude: number;
  longitude: number;
  updated_at: string;
}

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

interface UserTrackingMapProps {
  userId: string;
  requestId: string | null;
}

const UserTrackingMap = ({ userId, requestId }: UserTrackingMapProps) => {
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [provider, setProvider] = useState<ProviderInfo | null>(null);
  const [liveLocation, setLiveLocation] = useState<LiveLocation | null>(null);
  const [liveLocations, setLiveLocations] = useState<LiveLocation[]>([]); // For the trail
  const [distance, setDistance] = useState<number | null>(null);
  const [eta, setEta] = useState<number | null>(null); // in minutes
  const [loading, setLoading] = useState(true);

  // Load initial data
  const loadRequestData = async () => {
    if (!requestId) return;

    try {
      const { data, error } = await createClient()
        .from('service_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (error) throw error;

      setRequest(data as ServiceRequest);

      if (data.accepted_by_provider_id) {
        loadProviderInfo(data.accepted_by_provider_id);
      }

      // Load initial live location if available
      loadLiveLocation(requestId);
    } catch (error: any) {
      console.error('Error loading request data:', error);
      toast.error('Failed to load request data');
    } finally {
      setLoading(false);
    }
  };

  // Load provider info
  const loadProviderInfo = async (providerId: string) => {
    try {
      const { data, error } = await createClient()
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
  };

  // Load live location
  const loadLiveLocation = async (reqId: string) => {
    try {
      const response = await fetch(`/api/update-provider-location?requestId=${reqId}&userId=${userId}`);
      const result = await response.json();

      if (response.ok && result.location) {
        const location: LiveLocation = {
          latitude: result.location.latitude,
          longitude: result.location.longitude,
          updated_at: result.location.updatedAt
        };

        setLiveLocation(location);

        // Add to historical locations for trail
        setLiveLocations(prev => [...prev.slice(-19), location]); // Keep last 20 locations
      }
    } catch (error: any) {
      console.error('Error loading live location:', error);
    }
  };

  // Calculate distance and ETA
  useEffect(() => {
    if (request && liveLocation) {
      const dist = calculateDistance(
        liveLocation.latitude,
        liveLocation.longitude,
        request.request_latitude,
        request.request_longitude
      );
      setDistance(dist);

      // Calculate ETA (assuming average speed of 30 km/h for service providers)
      const etaMinutes = calculateETA(dist, 30);
      setEta(etaMinutes);
    }
  }, [liveLocation, request]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!requestId) return;

    loadRequestData();

    // Subscribe to request updates
    const supabase = createClient();
    const requestChannel = supabase
      .channel(`user-request-updates-${requestId}`)
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
        }
      )
      .subscribe();

    // Subscribe to live location updates
    const locationChannel = supabase
      .channel(`user-live-location-${requestId}`)
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

          // Add to historical locations for trail
          setLiveLocations(prev => [...prev.slice(-19), locationData]); // Keep last 20 locations
        }
      )
      .subscribe();

    // Set up polling for location updates if real-time doesn't work
    const locationPolling = setInterval(() => {
      if (requestId) {
        loadLiveLocation(requestId);
      }
    }, 5000); // Poll every 5 seconds

    return () => {
      supabase.removeChannel(requestChannel);
      supabase.removeChannel(locationChannel);
      clearInterval(locationPolling);
    };
  }, [requestId, userId]);

  if (loading || !request) {
    return (
      <Card className="shadow-sm border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg">Service Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading tracking information...</p>
        </CardContent>
      </Card>
    );
  }

  if (!request.accepted_by_provider_id) {
    return (
      <Card className="shadow-sm border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg">Service Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No provider assigned yet. Waiting for provider to accept your request...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-gray-200">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Service Tracking</CardTitle>
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
          {/* Map with live tracking */}
          <div className="h-80 rounded-lg overflow-hidden border">
            <MapComponent
              userLat={request.request_latitude}
              userLng={request.request_longitude}
              providerLat={liveLocation?.latitude || null}
              providerLng={liveLocation?.longitude || null}
              providerInfo={provider || undefined}
              liveLocations={liveLocations.map(loc => ({
                latitude: loc.latitude,
                longitude: loc.longitude,
                timestamp: loc.updated_at
              }))}
            />
          </div>

          {/* Provider info */}
          {provider && (
            <div className="flex items-center space-x-4">
              <div className="bg-gray-200 border-2 border-gray-200 rounded-full w-12 h-12 flex items-center justify-center">
                <span className="font-semibold text-gray-700">
                  {provider.firstName.charAt(0)}
                  {provider.lastName.charAt(0)}
                </span>
              </div>
              <div>
                <h3 className="font-semibold">
                  {provider.firstName} {provider.lastName}
                </h3>
                <p className="text-sm text-gray-600">{provider.service_type}</p>
              </div>
            </div>
          )}

          {/* Distance and ETA info */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            {distance !== null && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center text-sm text-blue-600 mb-1">
                  <Navigation className="w-4 h-4 mr-2" />
                  <span>Distance</span>
                </div>
                <p className="text-sm font-medium">{distance.toFixed(2)} km</p>
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

            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center text-sm text-gray-600 mb-1">
                <MapPin className="w-4 h-4 mr-2" />
                <span>Service Address</span>
              </div>
              <p className="text-sm font-medium">{request.address}</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center text-sm text-gray-600 mb-1">
                <Clock className="w-4 h-4 mr-2" />
                <span>Last Update</span>
              </div>
              <p className="text-sm font-medium">
                {liveLocation
                  ? new Date(liveLocation.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'N/A'}
              </p>
            </div>
          </div>

          {/* Communication buttons */}
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
        </div>
      </CardContent>
    </Card>
  );
};

export default UserTrackingMap;