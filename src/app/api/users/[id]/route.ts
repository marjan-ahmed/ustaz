import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { id: userId } = await params;

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    // First, try to get user info from the profiles table (covers both consumers and providers)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .single();

    if (profileData && !profileError) {
      // Found profile info
      return NextResponse.json({
        id: userId,
        name: profileData.full_name || 'User',
        email: profileData.email || '',
      });
    }

    // If not found in profiles, try to get from ustaz_registrations (providers)
    const { data: providerData, error: providerError } = await supabase
      .from('ustaz_registrations')
      .select('firstName, lastName, email')
      .eq('userId', userId)
      .single();

    if (providerData && !providerError) {
      // Found provider info
      return NextResponse.json({
        id: userId,
        name: `${providerData.firstName} ${providerData.lastName}`,
        email: providerData.email,
      });
    }

    // If still not found, return a default response
    return NextResponse.json({
      id: userId,
      name: 'User',
      email: '',
    });
  } catch (error) {
    console.error('Error fetching user info:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}