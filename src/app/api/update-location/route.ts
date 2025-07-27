// app/api/update-location/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';

export async function POST(req: NextRequest) {
  const supabase = createClient();

  try {
    const { userId, latitude, longitude } = await req.json();

    if (!userId || !latitude || !longitude) {
      return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
    }

    const point = `POINT(${longitude} ${latitude})`;

    const { error } = await supabase
      .from('ustaz_registrations')
      .update({ location: point })
      .eq('userId', userId);

    if (error) {
      console.error('Update failed:', error);
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Location updated successfully' });
  } catch (err) {
    console.error('Internal error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
