import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';

export async function POST(req: NextRequest) {
  const supabase = createClient();

  try {
    const { providerId, requestId, action } = await req.json(); // action can be 'accept' or 'reject'

    if (!providerId || !requestId || !action) {
      return NextResponse.json(
        { error: 'Missing required parameters: providerId, requestId, action' },
        { status: 400 }
      );
    }

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use "accept" or "reject"' },
        { status: 400 }
      );
    }

    // Get the service request to check its current status
    const { data: serviceRequest, error: requestError } = await supabase
      .from('service_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    // Handle the case where no service request is found (PGRST116 error)
    if (requestError) {
      if (requestError.code === 'PGRST116') {
        console.error('Service request not found:', requestId);
        return NextResponse.json(
          { error: 'Service request not found' },
          { status: 404 }
        );
      } else {
        console.error('Error fetching service request:', requestError);
        return NextResponse.json(
          { error: 'Service request not found', details: requestError.message },
          { status: 500 }
        );
      }
    }

    if (!serviceRequest) {
      return NextResponse.json(
        { error: 'Service request not found' },
        { status: 404 }
      );
    }

    // Check if the request is still available for acceptance
    if (serviceRequest.status === 'accepted') {
      return NextResponse.json(
        { error: 'Request has already been accepted by another provider' },
        { status: 400 }
      );
    }

    if (serviceRequest.status === 'cancelled' || serviceRequest.status === 'completed') {
      return NextResponse.json(
        { error: 'Request is no longer available' },
        { status: 400 }
      );
    }

    // Check if the provider is authorized to accept this request
    // (i.e., they were one of the notified providers)
    if (serviceRequest.notified_providers && !serviceRequest.notified_providers.includes(providerId)) {
      return NextResponse.json(
        { error: 'Provider was not notified of this request' },
        { status: 403 }
      );
    }

    if (action === 'accept') {
      // Use the database function to handle acceptance with race condition protection
      const { data, error: acceptError } = await supabase
        .rpc('accept_service_request', {
          p_provider_id: providerId,
          p_request_id: requestId
        });

      if (acceptError) {
        console.error('Error accepting service request:', acceptError);
        return NextResponse.json(
          { error: 'Failed to accept service request', details: acceptError.message },
          { status: 500 }
        );
      }

      if (!data || data.length === 0) {
        return NextResponse.json(
          { error: 'Failed to accept service request' },
          { status: 500 }
        );
      }

      const result = data[0];

      if (!result.success) {
        return NextResponse.json(
          { error: result.message },
          { status: 400 }
        );
      }

      return NextResponse.json({
        message: result.message,
        request: result.updated_request
      });
    } else if (action === 'reject') {
      // Use the database function to handle rejection
      const { data, error: rejectError } = await supabase
        .rpc('reject_service_request', {
          p_provider_id: providerId,
          p_request_id: requestId
        });

      if (rejectError) {
        console.error('Error rejecting service request:', rejectError);
        return NextResponse.json(
          { error: 'Failed to reject service request', details: rejectError.message },
          { status: 500 }
        );
      }

      if (!data || data.length === 0) {
        return NextResponse.json(
          { error: 'Failed to reject service request' },
          { status: 500 }
        );
      }

      const result = data[0];

      if (!result.success) {
        return NextResponse.json(
          { error: result.message },
          { status: 400 }
        );
      }

      return NextResponse.json({
        message: result.message
      });
    }
  } catch (error: any) {
    console.error('Unexpected error in handle-service-request API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to get provider's pending requests
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const url = new URL(req.url);
  const providerId = url.searchParams.get('providerId');

  if (!providerId) {
    return NextResponse.json(
      { error: 'Provider ID is required' },
      { status: 400 }
    );
  }

  try {
    // Get all service requests where this provider was notified but hasn't responded yet
    const { data: notifications, error: notificationError } = await supabase
      .from('notifications')
      .select(`
        id,
        request_id,
        message,
        service_type,
        status,
        created_at,
        service_requests (
          user_id,
          service_type,
          request_latitude,
          request_longitude,
          request_details,
          status,
          created_at
        )
      `)
      .eq('recipient_user_id', providerId)
      .in('status', ['pending']) // Only get pending notifications
      .order('created_at', { ascending: false });

    if (notificationError) {
      console.error('Error fetching provider notifications:', notificationError);
      return NextResponse.json(
        { error: 'Failed to fetch notifications', details: notificationError.message },
        { status: 500 }
      );
    }

    // Filter out requests that are no longer pending
    const pendingRequests = notifications
      .filter((notification: any) => {
        // Check if the associated service request is still pending
        const requestStatus = notification.service_requests?.status;
        return requestStatus && ['pending_notification', 'notified_multiple'].includes(requestStatus);
      })
      .map((notification: any) => ({
        notificationId: notification.id,
        requestId: notification.request_id,
        message: notification.message,
        serviceType: notification.service_type,
        status: notification.status,
        createdAt: notification.created_at,
        requestDetails: notification.service_requests
      }));

    return NextResponse.json({ requests: pendingRequests });
  } catch (error: any) {
    console.error('Unexpected error in GET provider requests:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}