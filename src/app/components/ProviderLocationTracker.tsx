'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { MapPin, Navigation, Clock, Radio, Circle } from 'lucide-react';

interface ProviderLocationTrackerProps {
  providerId: string;
  requestId: string | null;
  isActive: boolean;
  onLocationUpdate?: (location: { latitude: number; longitude: number }) => void;
}

const ProviderLocationTracker = ({
  providerId,
  requestId,
  isActive,
  onLocationUpdate
}: ProviderLocationTrackerProps) => {
  const [isSharing, setIsSharing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Function to update location in the database
  const updateLocationInDatabase = async (lat: number, lng: number) => {
    if (!requestId) {
      console.warn('No request ID provided, cannot update location');
      return;
    }

    try {
      const response = await fetch('/api/update-provider-location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerId,
          requestId,
          latitude: lat,
          longitude: lng
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update location');
      }

      // Update state with new location
      setCurrentLocation({ latitude: lat, longitude: lng });
      setLastUpdateTime(new Date().toLocaleTimeString());

      // Log the provider location for debugging
      console.log('Provider location updated:', { latitude: lat, longitude: lng, timestamp: new Date().toISOString() });

      // Call parent callback if provided
      if (onLocationUpdate) {
        onLocationUpdate({ latitude: lat, longitude: lng });
      }

      // Reset progress bar
      setProgress(0);

      // Increment progress every second to show next update time
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            return 100;
          }
          return prev + 20; // Updates every 5 seconds (100/5 = 20% per second)
        });
      }, 1000);

    } catch (err: any) {
      console.error('Error updating location:', err);
      setError(err.message);
      toast.error(`Failed to update location: ${err.message}`);
    }
  };

  // Function to start location tracking
  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    if (!requestId) {
      setError('No active service request to track location for');
      toast.error('No active service request to track location for');
      return;
    }

    setIsSharing(true);
    setError(null);

    // Use watchPosition to continuously track location
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updateLocationInDatabase(latitude, longitude);
      },
      (err) => {
        setError(`Unable to retrieve your location: ${err.message}`);
        toast.error(`Unable to retrieve your location: ${err.message}`);
        stopLocationTracking();
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000, // 10 seconds
        timeout: 5000,     // 5 seconds
      }
    );

    setWatchId(id);
    toast.success('Location tracking started');
  };

  // Function to stop location tracking
  const stopLocationTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setIsSharing(false);
    setProgress(0);
    toast.success('Location tracking stopped');
  };

  // Effect to start/stop tracking based on isActive prop
  useEffect(() => {
    if (isActive && !isSharing) {
      startLocationTracking();
    } else if (!isActive && isSharing) {
      stopLocationTracking();
    }
  }, [isActive]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [watchId]);

  return (
    <Card className="shadow-sm border-gray-200">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Location Tracking</CardTitle>
          {isSharing ? (
            <Badge className="bg-green-500 flex items-center">
              <Radio className="w-4 h-4 mr-1" />
              Active
            </Badge>
          ) : (
            <Badge variant="outline" className="flex items-center">
              <Circle className="w-4 h-4 mr-1" />
              Inactive
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Live Location Sharing</span>
            <Button
              size="sm"
              variant={isSharing ? "destructive" : "default"}
              onClick={isSharing ? stopLocationTracking : startLocationTracking}
            >
              {isSharing ? 'Stop Sharing' : 'Start Sharing'}
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {currentLocation && (
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                <span className="font-medium">Current Location:</span>
                <span className="ml-2">
                  {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                </span>
              </div>

              {lastUpdateTime && (
                <div className="flex items-center text-sm">
                  <Clock className="w-4 h-4 mr-2 text-gray-500" />
                  <span>Last updated: {lastUpdateTime}</span>
                </div>
              )}
            </div>
          )}

          {isSharing && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Next update in</span>
                <span>{Math.max(0, 5 - Math.floor(progress / 20))}s</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <Navigation className="w-3 h-3 mr-1" />
                <span>Location updates every 5 seconds</span>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-blue-700 text-sm">
              {isSharing
                ? 'Your location is being shared with the customer in real-time'
                : 'Start sharing your location when you\'re on the way to the service location'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProviderLocationTracker;