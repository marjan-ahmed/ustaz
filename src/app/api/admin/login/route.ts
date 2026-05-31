import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

function signToken(payload: string): string {
  const secret = process.env.INTERNAL_API_SECRET || 'admin-secret-fallback';
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  return `${payload}.${hmac.digest('hex')}`;
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: 'Admin credentials not configured on server' },
        { status: 500 },
      );
    }

    if (email !== adminEmail || password !== adminPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 },
      );
    }

    // Create a signed session cookie (valid for 24 hours)
    const expiry = Date.now() + 24 * 60 * 60 * 1000;
    const payload = JSON.stringify({ email: adminEmail, exp: expiry });
    const token = signToken(payload);

    const response = NextResponse.json({ success: true });

    response.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: e.message },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('admin_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
