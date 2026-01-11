import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';

export async function POST(req: NextRequest) {
  const supabase = createClient();

  try {
    const { requestId, providerId, userId, action } = await req.json(); // action can be 'arriving', 'in_progress', 'completed', 'cancelled'

    if (!requestId || !action) {
      return NextResponse.json(
        { error: 'Missing required parameters: requestId, action' },
        { status: 400 }
      );
    }

    if (!['arriving', 'in_progress', 'completed', 'cancelled'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use "arriving", "in_progress", "completed", or "cancelled"' },
        { status: 400 }
      );
    }

    // Get the service request to check its current status and authorization
    const { data: serviceRequest, error: requestError } = await supabase
      .from('service_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError) {
      console.error('Error fetching service request:', requestError);
      return NextResponse.json(
        { error: 'Service request not found', details: requestError.message },
        { status: 404 }
      );
    }

    if (!serviceRequest) {
      return NextResponse.json(
        { error: 'Service request not found' },
        { status: 404 }
      );
    }

    // Validate authorization based on the action
    let authorized = false;

    switch (action) {
      case 'arriving':
      case 'in_progress':
      case 'completed':
        // Provider must be the one assigned to the request
        authorized = serviceRequest.accepted_by_provider_id === providerId;
        break;
      case 'cancelled':
        // Either the user who created the request or the assigned provider can cancel
        authorized = serviceRequest.user_id === userId || serviceRequest.accepted_by_provider_id === providerId;
        break;
    }

    if (!authorized) {
      return NextResponse.json(
        { error: 'Unauthorized to perform this action' },
        { status: 403 }
      );
    }

    let resultData;
    let resultError;

    // Use the appropriate database function based on the action
    switch (action) {
      case 'arriving':
        ({ data: resultData, error: resultError } = await supabase
          .rpc('update_request_to_arriving', {
            p_request_id: requestId,
            p_provider_id: providerId
          }));
        break;
      case 'in_progress':
        ({ data: resultData, error: resultError } = await supabase
          .rpc('update_request_to_in_progress', {
            p_request_id: requestId,
            p_provider_id: providerId
          }));
        break;
      case 'completed':
        ({ data: resultData, error: resultError } = await supabase
          .rpc('update_request_to_completed', {
            p_request_id: requestId,
            p_provider_id: providerId
          }));
        break;
      case 'cancelled':
        ({ data: resultData, error: resultError } = await supabase
          .rpc('cancel_service_request', {
            p_request_id: requestId,
            p_user_id: userId,
            p_provider_id: providerId
          }));
        break;
    }

    if (resultError) {
      console.error(`Error updating request status to ${action}:`, resultError);
      return NextResponse.json(
        { error: `Failed to update request status to ${action}`, details: resultError.message },
        { status: 500 }
      );
    }

    if (!resultData || resultData.length === 0) {
      return NextResponse.json(
        { error: `Failed to update request status to ${action}` },
        { status: 500 }
      );
    }

    const result = resultData[0];

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

  } catch (error: any) {
    console.error('Unexpected error in update-request-status API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}