// pages/api/request-service.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for API routes
// Use service role key for backend operations that modify data
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use service role key

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { user_id, serviceType, userLat, userLon, requestDetails, selectedProviderIds, requestId } = req.body;

  // Basic validation
  if (!user_id || !serviceType || userLat === undefined || userLon === undefined || !selectedProviderIds || !Array.isArray(selectedProviderIds) || selectedProviderIds.length === 0) {
    return res.status(400).json({ message: 'Missing or invalid required parameters.' });
  }

  try {
    let currentRequestId = requestId;
    let requestStatus: string;

    // If no requestId is provided, create a new service request
    if (!currentRequestId) {
      const { data: newRequest, error: requestError } = await supabaseAdmin
        .from('service_requests')
        .insert({
          user_id: user_id,
          service_type: serviceType,
          user_lat: userLat,
          user_lng: userLon,
          details: requestDetails,
          status: 'pending_notification', // Initial status
          notified_providers: selectedProviderIds, // Store who was notified
        })
        .select('id, status')
        .single();

      if (requestError) {
        console.error('Error creating service request:', requestError);
        return res.status(500).json({ message: 'Failed to create service request.', error: requestError.message });
      }
      currentRequestId = newRequest.id;
      requestStatus = newRequest.status;
    } else {
      // If requestId is provided, update the existing request (e.g., for re-notifying)
      // You might want more sophisticated logic here, e.g., only update if status allows it
      const { data: updatedRequest, error: updateError } = await supabaseAdmin
        .from('service_requests')
        .update({
          service_type: serviceType,
          user_lat: userLat,
          user_lng: userLon,
          details: requestDetails,
          status: 'pending_notification', // Reset status if re-notifying
          notified_providers: selectedProviderIds,
          accepted_by_provider_id: null, // Clear accepted provider if re-notifying
        })
        .eq('id', currentRequestId)
        .eq('user_id', user_id) // Ensure only owner can update
        .select('id, status')
        .single();

      if (updateError) {
        console.error('Error updating service request:', updateError);
        return res.status(500).json({ message: 'Failed to update service request.', error: updateError.message });
      }
      requestStatus = updatedRequest.status;
    }

    // Insert notifications for each selected provider
    const notificationsToInsert = selectedProviderIds.map((providerId: string) => ({
      user_id: user_id,
      provider_id: providerId,
      service_type: serviceType,
      user_lat: userLat,
      user_lng: userLon,
      message: requestDetails,
      status: 'unread',
      request_id: currentRequestId, // Link notification to the service request
    }));

    const { error: notificationsError } = await supabaseAdmin
      .from('notifications')
      .insert(notificationsToInsert);

    if (notificationsError) {
      console.error('Error inserting notifications:', notificationsError);
      // Even if notifications fail, the request might still be valid, but log the error
      return res.status(500).json({ message: 'Service request created, but failed to send some notifications.', error: notificationsError.message, requestId: currentRequestId, status: requestStatus });
    }

    return res.status(200).json({
      message: 'Service request initiated and providers notified!',
      requestId: currentRequestId,
      status: requestStatus,
    });

  } catch (error: any) {
    console.error('API error in request-service:', error);
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
}
