// components/UstazRequestsListener.tsx (or in an Ustaz dashboard page)
import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface ServiceRequest {
  id: string;
  user_id: string;
  service_type: string;
  request_latitude: number;
  request_longitude: number;
  request_details: string | null;
  status: string;
  created_at: string;
  // Add other fields you fetch
}

interface UstazRequestsListenerProps {
  currentUstazServiceType: string; // The service type this Ustaz provides
  currentUstazId: string; // The specific Ustaz's userId from ustaz_registrations
}

const UstazRequestsListener: React.FC<UstazRequestsListenerProps> = ({
  currentUstazServiceType,
  currentUstazId
}) => {
  const [newRequests, setNewRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch of pending requests (optional, to catch up if offline)
    const fetchInitialRequests = async () => {
        setLoading(true);
        const { data, error: fetchError } = await supabase
            .from('service_requests')
            .select('*')
            .eq('service_type', currentUstazServiceType)
            .eq('status', 'pending'); // Only show pending requests

        if (fetchError) {
            setError(fetchError.message);
            console.error('Error fetching initial requests:', fetchError);
        } else if (data) {
            setNewRequests(data);
        }
        setLoading(false);
    };

    fetchInitialRequests();

    // Set up Realtime listener
    const channel = supabase
      .channel('service_requests_channel') // Use a unique channel name for your app
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // Listen only for new requests
          schema: 'public',
          table: 'service_requests',
          filter: `service_type=eq.${currentUstazServiceType}`, // Filter by service type relevant to this Ustaz
        },
        (payload) => {
          console.log('New service request received (Realtime):', payload.new);
          const newRequest = payload.new as ServiceRequest;
          // Check if this request is relevant to the Ustaz (e.g., if it's not already accepted)
          if (newRequest.status === 'pending') {
            setNewRequests((prev) => [newRequest, ...prev]);
            // You can trigger a UI notification here (e.g., a toast or modal)
            alert(`New ${newRequest.service_type} Request!`);
          }
        }
      )
      .on( // Also listen for updates to pending requests (e.g., if they are assigned or cancelled)
        'postgres_changes',
        {
            event: 'UPDATE',
            schema: 'public',
            table: 'service_requests',
            filter: `service_type=eq.${currentUstazServiceType}`
        },
        (payload) => {
            const updatedRequest = payload.new as ServiceRequest;
            // Remove the updated request if it's no longer pending or relevant
            setNewRequests(prev => prev.filter(req => req.id !== updatedRequest.id));
            if (updatedRequest.status === 'pending') { // Re-add if it became pending again or was updated but remains pending
                setNewRequests(prev => [updatedRequest, ...prev]);
            }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel); // Clean up the subscription
    };
  }, [currentUstazServiceType, currentUstazId]); // Re-subscribe if service type or ID changes

  if (loading) return <div>Loading requests...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="p-4">
      <h3 className="text-xl font-semibold mb-4">New Service Requests for {currentUstazServiceType}</h3>
      {newRequests.length === 0 ? (
        <p>No new requests at the moment.</p>
      ) : (
        <ul className="space-y-4">
          {newRequests.map((request) => (
            <li key={request.id} className="bg-white p-4 rounded-lg shadow-md border-l-4 border-indigo-500">
              <p className="font-bold">Service Type: {request.service_type}</p>
              <p className="text-sm text-gray-600">Request at: Lat {request.request_latitude.toFixed(4)}, Lng {request.request_longitude.toFixed(4)}</p>
              {request.request_details && <p className="text-sm mt-1">Details: {request.request_details}</p>}
              <p className="text-xs text-gray-500 mt-2">Received: {new Date(request.created_at).toLocaleString()}</p>
              {/* Add buttons for Accept/Reject here, which would update the request status in DB */}
              <div className="mt-3 space-x-2">
                <button
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                  onClick={() => console.log(`Accepting request ${request.id}`)} // Implement accept logic
                >
                  Accept
                </button>
                <button
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  onClick={() => console.log(`Rejecting request ${request.id}`)} // Implement reject logic
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UstazRequestsListener;