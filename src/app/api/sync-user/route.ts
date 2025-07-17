import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../client/supabaseClient'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    // Optional: fetch more user info from Clerk here if needed
    // For example, if you want to sync email or name, pass those from client or use Clerk API

    // Insert or upsert user into Supabase table "users"
    const { error } = await supabase
      .from('users')
      .upsert({ id: userId }) // add more fields as needed

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'User synced successfully' })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
