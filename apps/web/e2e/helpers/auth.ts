import { createClient } from '@supabase/supabase-js';
import type { Page, BrowserContext } from '@playwright/test';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PROJECT_REF = 'solrsmnkxklsqklqhgxf';

/** Create a Supabase admin client (service_role) for user management. */
export function getAdminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Create a Supabase anon client for session operations. */
export function getAnonClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export interface TestUser {
  id: string;
  email: string;
  phone: string;
}

/**
 * Create a test user via Supabase admin API.
 */
export async function createTestUser(
  prefix: string,
  role: 'customer' | 'provider',
): Promise<TestUser> {
  const admin = getAdminClient();
  const suffix = `${prefix}-${role}-${Date.now()}`;
  const email = `${suffix}@ustaz-test.local`;
  const phone = `+92${String(Math.random()).slice(2, 13)}`;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    phone,
    password: 'TestPass123!',
    email_confirm: true,
    phone_confirm: true,
    user_metadata: {
      name: role === 'customer' ? 'Test Customer' : 'Test Provider',
      role,
    },
  });

  if (error) throw new Error(`Failed to create test user: ${error.message}`);
  if (!data.user) throw new Error('No user returned');

  return { id: data.user.id, email, phone };
}

/** Register a provider in the ustaz_registrations table. */
export async function registerProvider(
  providerId: string,
  serviceType = 'Plumbing',
): Promise<void> {
  const admin = getAdminClient();
  const { error } = await admin.from('ustaz_registrations').insert({
    userId: providerId,
    firstName: 'Test',
    lastName: 'Provider',
    email: `provider-${providerId.slice(0, 8)}@ustaz-test.local`,
    phoneNumber: String(Math.random()).slice(2, 12),
    phoneCountryCode: '+92',
    service_type: serviceType,
    city: 'Islamabad',
    cnic: '4220112345678',
    heardFrom: 'test',
    hasActiveMobile: true,
    registrationDate: new Date().toISOString(),
    phone_verified: true,
    provider_status: 'available',
  });

  if (error) {
    if (error.code === '23505') return; // unique violation — already registered
    throw new Error(`Failed to register provider: ${error.message}`);
  }
}

/**
 * Sign in a user by setting Supabase auth cookies in the browser context.
 * This is faster and more reliable than going through the UI login flow.
 */
export async function signInByCookie(
  context: BrowserContext,
  email: string,
): Promise<void> {
  const anon = getAnonClient();

  // Sign in via password to get a session
  const { data, error } = await anon.auth.signInWithPassword({
    email,
    password: 'TestPass123!',
  });

  if (error) throw new Error(`Sign-in failed: ${error.message}`);
  if (!data.session) throw new Error('No session created');

  const session = data.session;

  // Set the Supabase auth cookie in the browser context
  const cookieName = `sb-${PROJECT_REF}-auth-token`;
  const cookieValue = JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: session.expires_in,
    expires_at: Math.floor(Date.now() / 1000) + session.expires_in,
    token_type: session.token_type,
  });

  await context.addCookies([
    {
      name: cookieName,
      value: cookieValue,
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax' as const,
    },
  ]);
}

/**
 * Create a test customer + provider pair.
 * Sets up the provider registration and returns both users.
 */
export async function createTestPair(
  testId: string,
  serviceType = 'Plumbing',
): Promise<{ customer: TestUser; provider: TestUser }> {
  const customer = await createTestUser(testId, 'customer');
  const provider = await createTestUser(testId, 'provider');
  await registerProvider(provider.id, serviceType);
  return { customer, provider };
}

/** Delete test users and clean up their auth records. */
export async function deleteTestUsers(users: TestUser[]): Promise<void> {
  const admin = getAdminClient();
  for (const user of users) {
    await admin.auth.admin.deleteUser(user.id).catch(() => {});
  }
}
