'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/server';
import UserTrackingMap from '../components/UserTrackingMap';
import ProviderRequestTracker from '../components/ProviderRequestTracker';
import ProviderLocationTracker from '../components/ProviderLocationTracker';
import ChatComponent from '../components/ChatComponent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function TestTrackingPage() {
  // Mock user and provider IDs for testing
  const [userId, setUserId] = useState<string>('test-user-123');
  const [providerId, setProviderId] = useState<string>('test-provider-456');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [requestStatus, setRequestStatus] = useState<string>('not_created');
  const [isProviderTrackingActive, setIsProviderTrackingActive] = useState<boolean>(false);

  // Create a real service request
  const createServiceRequest = async () => {
    try {
      // Using real API call instead of mock
      const response = await fetch('/api/create-service-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          serviceType: 'electrician',
          userLat: 24.8607, // Karachi coordinates
          userLng: 67.0011,
          requestDetails: 'Electrical repair needed for test',
          radiusKm: 5
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create service request');
      }

      setRequestId(result.requestId);
      setRequestStatus('pending_notification');
      toast.success('Service request created successfully!');

      // Simulate provider acceptance after a delay
      setTimeout(() => {
        if (result.requestId) {
          simulateProviderAcceptance(result.requestId);
        }
      }, 2000);

    } catch (error: any) {
      console.error('Error creating service request:', error);
      toast.error('Failed to create service request: ' + error.message);
    }
  };

  // Simulate provider accepting the request
  const simulateProviderAcceptance = async (reqId: string) => {
    try {
      const response = await fetch('/api/handle-service-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerId,
          requestId: reqId,
          action: 'accept'
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to accept request');
      }

      setRequestStatus('accepted');
      toast.success('Request accepted by provider!');
    } catch (error: any) {
      console.error('Error accepting request:', error);
      toast.error('Failed to accept request: ' + error.message);
    }
  };

  // Update request status
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

      setRequestStatus(action);
      toast.success(`Request status updated to ${action}`);
    } catch (error: any) {
      console.error('Error updating request status:', error);
      toast.error(error.message || 'Failed to update request status');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Real-time Provider Tracking Test</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* User Side */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>User Dashboard</span>
                <Badge variant="outline">User ID: {userId}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Button onClick={createServiceRequest} disabled={requestId !== null}>
                    Create Service Request
                  </Button>
                  {requestId && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setRequestId(null);
                        setRequestStatus('not_created');
                        setIsProviderTrackingActive(false);
                        toast.info('Request cleared');
                      }}
                    >
                      Clear Request
                    </Button>
                  )}
                </div>

                {requestId && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium">Request ID: {requestId}</p>
                    <p>Status: <Badge variant="outline">{requestStatus}</Badge></p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {requestId && (
            <UserTrackingMap userId={userId} requestId={requestId} />
          )}
        </div>

        {/* Provider Side */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Provider Dashboard</span>
                <Badge variant="outline">Provider ID: {providerId}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {requestId && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => updateRequestStatus('arriving')}
                      disabled={requestStatus !== 'accepted'}
                    >
                      Mark as Arriving
                    </Button>
                    <Button
                      onClick={() => updateRequestStatus('in_progress')}
                      disabled={requestStatus !== 'arriving' && requestStatus !== 'accepted'}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Start Service
                    </Button>
                    <Button
                      onClick={() => updateRequestStatus('completed')}
                      disabled={requestStatus !== 'in_progress'}
                      className="bg-teal-600 hover:bg-teal-700"
                    >
                      Complete Service
                    </Button>
                  </div>
                )}

                {requestId && (
                  <div className="mt-4">
                    <ProviderLocationTracker
                      providerId={providerId}
                      requestId={requestId}
                      isActive={isProviderTrackingActive}
                      onLocationUpdate={(location) => {
                        console.log('Location updated:', location);
                      }}
                    />
                    <div className="mt-2">
                      <Button
                        onClick={() => setIsProviderTrackingActive(!isProviderTrackingActive)}
                        variant={isProviderTrackingActive ? "destructive" : "default"}
                      >
                        {isProviderTrackingActive ? 'Stop Tracking' : 'Start Tracking'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {requestId && (
            <ProviderRequestTracker
              providerId={providerId}
              requestId={requestId}
              onStatusChange={(newStatus) => {
                setRequestStatus(newStatus);
                toast.info(`Request status changed to: ${newStatus}`);
              }}
            />
          )}
        </div>
      </div>

      {/* Chat Component */}
      {requestId && (
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Communication</CardTitle>
            </CardHeader>
            <CardContent>
              <ChatComponent
                currentUserId={userId}
                otherUserId={providerId}
                currentUserName="Test User"
                otherUserName="Test Provider"
                onClose={() => {}}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-800">Service Request</h3>
              <p>ID: {requestId || 'Not created'}</p>
              <p>Status: {requestStatus}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-800">Provider Tracking</h3>
              <p>Status: {isProviderTrackingActive ? 'Active' : 'Inactive'}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-medium text-purple-800">Real-time Updates</h3>
              <p>Enabled: ✓</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Test Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Click "Create Service Request" to start the test</li>
            <li>After ~2 seconds, the request will be automatically accepted by the provider</li>
            <li>Click "Mark as Arriving" when the provider is on the way</li>
            <li>Click "Start Service" when the provider begins work</li>
            <li>Click "Complete Service" when the job is finished</li>
            <li>Use the location tracker to start sharing live location</li>
            <li>Try the chat functionality between user and provider</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}