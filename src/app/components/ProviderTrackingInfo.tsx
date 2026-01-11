'use client';

import { useState, useEffect } from 'react';
import { Phone, MessageSquare, Clock, Navigation, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProviderInfo {
  user_id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  phoneCountryCode: string;
  email?: string;
}

interface LiveLocation {
  latitude: number;
  longitude: number;
  updated_at: string;
}

interface ProviderTrackingInfoProps {
  userLat: number | null;
  userLng: number | null;
  provider: ProviderInfo | null;
  liveLocation: LiveLocation | null;
  onRequestChat: () => void;
  onCallProvider: () => void;
}

const ProviderTrackingInfo: React.FC<ProviderTrackingInfoProps> = ({
  userLat,
  userLng,
  provider,
  liveLocation,
  onRequestChat,
  onCallProvider
}) => {
  const [distance, setDistance] = useState<number | null>(null);
  const [eta, setEta] = useState<number | null>(null); // in minutes

  // Calculate distance and ETA
  useEffect(() => {
    if (
      userLat !== null &&
      userLng !== null &&
      liveLocation?.latitude !== undefined &&
      liveLocation?.longitude !== undefined
    ) {
      // Check if coordinates are valid
      if (
        isNaN(userLat) ||
        isNaN(userLng) ||
        isNaN(liveLocation.latitude) ||
        isNaN(liveLocation.longitude)
      ) {
        setDistance(null);
        setEta(null);
        return;
      }

      // Calculate distance using Haversine formula (in km)
      const R = 6371; // Earth radius in km
      const dLat = (liveLocation.latitude - userLat) * Math.PI / 180;
      const dLon = (liveLocation.longitude - userLng) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(userLat * Math.PI / 180) * Math.cos(liveLocation.latitude * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanceKm = R * c;

      setDistance(parseFloat(distanceKm.toFixed(2)));

      // Calculate ETA (assuming average speed of 30 km/h for service providers)
      const etaMinutes = (distanceKm / 30) * 60;
      setEta(Math.round(etaMinutes));
    } else {
      setDistance(null);
      setEta(null);
    }
  }, [userLat, userLng, liveLocation]);

  if (!provider) {
    return null;
  }

  return (
    <Card className="shadow-sm border-gray-200 mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Provider Information</CardTitle>
          <Badge className={liveLocation ? "bg-green-500" : "bg-yellow-500"}>
            {liveLocation ? "On the way" : "Accepted"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="bg-gray-200 border-2 border-gray-200 rounded-full w-12 h-12 flex items-center justify-center">
              <span className="font-semibold text-gray-700">
                {provider.firstName.charAt(0)}
                {provider.lastName.charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                {provider.firstName} {provider.lastName}
              </h3>
              <p className="text-sm text-gray-600">Service Provider</p>
            </div>
          </div>

          {liveLocation && (
            <div className="grid grid-cols-2 gap-4 pt-2">
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

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>Location</span>
                </div>
                <p className="text-sm font-medium">
                  {liveLocation.latitude.toFixed(4)}, {liveLocation.longitude.toFixed(4)}
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>Updated</span>
                </div>
                <p className="text-sm font-medium">
                  {new Date(liveLocation.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-2">
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={onCallProvider}
            >
              <Phone className="w-4 h-4 mr-2" />
              Call
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={onRequestChat}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProviderTrackingInfo;