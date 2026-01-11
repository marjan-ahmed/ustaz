import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';

export async function POST(req: NextRequest) {
  const supabase = createClient();

  try {
    const { providerId, online } = await req.json();

    if (!providerId || typeof online !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required parameters: providerId, online' },
        { status: 400 }
      );
    }

    // Use the database function to update provider status
    const { error } = await supabase.rpc('update_provider_online_status', {
      p_user_id: providerId,
      p_online: online
    });

    if (error) {
      console.error('Error updating provider online status:', error);
      return NextResponse.json(
        { error: 'Failed to update provider status', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Provider status updated successfully',
      providerId,
      online
    });
  } catch (error: any) {
    console.error('Unexpected error in provider-status API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to check if provider is online
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
    const { data, error } = await supabase
      .from('ustaz_registrations')
      .select('online_status, provider_status, last_seen_at')
      .eq('userId', providerId)
      .single();

    if (error) {
      console.error('Error fetching provider status:', error);
      return NextResponse.json(
        { error: 'Failed to fetch provider status', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      online: data?.online_status,
      status: data?.provider_status,
      lastSeen: data?.last_seen_at
    });
  } catch (error: any) {
    console.error('Unexpected error in GET provider-status API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}