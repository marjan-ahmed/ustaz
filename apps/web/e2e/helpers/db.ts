import { Pool } from 'pg';

/** Single shared connection pool for the test suite. */
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const url =
      process.env.POSTGRES_URL_NON_POOLING ||
      process.env.POSTGRES_URL ||
      '';

    // Strip query params (sslmode=require) to avoid pg treating 'require' as 'verify-full'.
    // Handle SSL via the pool options instead.
    const cleanUrl = url.split('?')[0];
    pool = new Pool({
      connectionString: cleanUrl,
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/** Clean up test data created during test runs. */
export async function cleanTestData(
  customerUserId: string,
  providerUserId: string,
): Promise<void> {
  const p = getPool();
  // Reset rating columns on service_requests (no separate ratings table)
  await p.query(
    `UPDATE service_requests
     SET customer_rated = false, customer_rating_value = NULL,
         customer_rating_comment = NULL, provider_rated = false,
         provider_rating_value = NULL
     WHERE user_id = $1 OR accepted_by_provider_id = $2`,
    [customerUserId, providerUserId],
  );
  await p.query(
    `DELETE FROM live_locations WHERE provider_id = $1`,
    [providerUserId],
  );
  await p.query(
    `DELETE FROM favorites WHERE customer_id = $1 OR provider_id = $2`,
    [customerUserId, providerUserId],
  );
  // Clean up Tier 0 tables
  await p.query(
    `DELETE FROM incidents WHERE provider_id = $1 OR request_id IN (
      SELECT id FROM service_requests WHERE user_id = $2 OR accepted_by_provider_id = $1
    )`,
    [providerUserId, customerUserId],
  );
  await p.query(
    `DELETE FROM provider_performance WHERE provider_id = $1`,
    [providerUserId],
  );
  await p.query(
    `DELETE FROM provider_standing WHERE provider_id = $1`,
    [providerUserId],
  );
  await p.query(
    `DELETE FROM appeals WHERE provider_id = $1`,
    [providerUserId],
  );
  await p.query(
    `DELETE FROM warranty_claims WHERE customer_id = $1 OR provider_id = $2`,
    [customerUserId, providerUserId],
  );
  await p.query(
    `DELETE FROM service_requests WHERE user_id = $1 OR accepted_by_provider_id = $2`,
    [customerUserId, providerUserId],
  );
  await p.query(
    `DELETE FROM notifications WHERE sender_user_id = $1 OR recipient_user_id = $2`,
    [customerUserId, providerUserId],
  );
  // Flag provider as available again
  await p.query(
    `UPDATE ustaz_registrations SET provider_status = 'available' WHERE userId = $1`,
    [providerUserId],
  );
}

/** Create a service request in the DB pre-accepted and return its id. */
export async function createServiceRequest(
  customerUserId: string,
  providerUserId: string,
  serviceType = 'Plumbing',
): Promise<string> {
  const p = getPool();
  const { rows } = await p.query(
    `INSERT INTO service_requests
      (user_id, service_type, address, request_latitude, request_longitude,
       request_details, status, notified_providers, accepted_by_provider_id)
     VALUES ($1, $2, $3, 33.6844, 73.0479, $4, 'accepted',
             ARRAY[$5::uuid], $5::uuid)
     RETURNING id`,
    [customerUserId, serviceType, `123 Test Street, Islamabad`, `Test address for ${serviceType}`, providerUserId],
  );
  return rows[0].id;
}

/**
 * Advance the request status via direct SQL UPDATE (bypasses RPC auth checks).
 *
 * IMPORTANT: This is for test data setup only — it writes directly to the DB
 * and does NOT perform the auth.uid() checks that the RPCs enforce.
 * For testing the actual auth-gated flow, use the UI buttons or API routes.
 */
export async function advanceRequestStatus(
  requestId: string,
  action: string,
  providerUserId: string,
  customerUserId?: string,
): Promise<{ success: boolean; message: string }> {
  const p = getPool();

  try {
    if (action === 'arriving') {
      await p.query(
        `UPDATE service_requests SET status = 'arriving', updated_at = NOW()
         WHERE id = $1 AND accepted_by_provider_id = $2`,
        [requestId, providerUserId],
      );
    } else if (action === 'arrived') {
      await p.query(
        `UPDATE service_requests SET status = 'arrived', provider_arrived_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND accepted_by_provider_id = $2`,
        [requestId, providerUserId],
      );
    } else if (action === 'start_service' || action === 'in_progress') {
      await p.query(
        `UPDATE service_requests SET status = 'in_progress', service_started_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND accepted_by_provider_id = $2`,
        [requestId, providerUserId],
      );
    } else if (action === 'completed') {
      await p.query(
        `UPDATE service_requests SET status = 'completed', service_completed_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND accepted_by_provider_id = $2`,
        [requestId, providerUserId],
      );
      await p.query(
        `UPDATE ustaz_registrations SET provider_status = 'available' WHERE userId = $1`,
        [providerUserId],
      );
      await p.query(`DELETE FROM live_locations WHERE request_id = $1`, [requestId]);
    } else if (action === 'cancelled') {
      await p.query(
        `UPDATE service_requests SET status = 'cancelled', updated_at = NOW()
         WHERE id = $1`,
        [requestId],
      );
      if (providerUserId) {
        await p.query(
          `UPDATE ustaz_registrations SET provider_status = 'available' WHERE userId = $1`,
          [providerUserId],
        );
      }
    } else {
      throw new Error(`Unknown action: ${action}`);
    }

    return { success: true, message: `${action} — status updated via DB` };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export interface ProviderWithStatusOptions {
  onlineStatus: boolean;
  providerStatus: string;
  serviceType: string;
  latitude: number;
  longitude: number;
  walletBalance: number;
}

/**
 * Create or update a provider with specific online_status, provider_status,
 * location, and wallet balance for dispatch testing.
 *
 * This writes directly to the DB (bypasses RPC auth) for test data setup.
 */
export async function createProviderWithStatus(
  providerId: string,
  options: ProviderWithStatusOptions,
): Promise<void> {
  const p = getPool();

  // Upsert provider registration with specific status (must exist before wallet)
  // Use unique CNIC derived from provider ID to avoid unique constraint violations
  const uniqueCnic = `42201${providerId.replace(/-/g, '').slice(0, 8)}`;
  await p.query(
    `INSERT INTO ustaz_registrations (
      "userId", "firstName", "lastName", "email", "phoneNumber",
      "phoneCountryCode", "service_type", "city", "cnic", "heardFrom",
      "hasActiveMobile", "registrationDate", "phone_verified",
      "online_status", "provider_status", "location"
    ) VALUES (
      $1, 'Test', 'Provider', $5, $6,
      '+92', $3, 'Islamabad', $9, 'test',
      true, NOW(), true,
      $2, $4, ST_SetSRID(ST_MakePoint($8, $7), 4326)::geography
    )
    ON CONFLICT ("userId") DO UPDATE SET
      "online_status" = $2,
      "provider_status" = $4,
      "service_type" = $3,
      location = ST_SetSRID(ST_MakePoint($8, $7), 4326)::geography`,
    [
      providerId,
      options.onlineStatus,
      options.serviceType,
      options.providerStatus,
      `provider-${providerId.slice(0, 8)}@ustaz-test.local`,
      String(Math.random()).slice(2, 12),
      options.latitude,
      options.longitude,
      uniqueCnic,
    ],
  );

  // Ensure wallet exists with required balance (after registration)
  await p.query(
    `INSERT INTO provider_wallets (provider_id, balance, total_earned, total_commission_paid)
     VALUES ($1, $2, 0, 0)
     ON CONFLICT (provider_id) DO UPDATE SET balance = $2`,
    [providerId, options.walletBalance],
  );
}

/**
 * Clean up dispatch test data: service_requests, notifications, provider status.
 */
export async function cleanupDispatchTest(providerId: string): Promise<void> {
  const p = getPool();
  await p.query(
    `DELETE FROM notifications WHERE recipient_user_id = $1`,
    [providerId],
  );
  await p.query(
    `DELETE FROM service_requests WHERE accepted_by_provider_id = $1 OR notified_providers @> ARRAY[$1::uuid]`,
    [providerId],
  );
  await p.query(
    `UPDATE ustaz_registrations SET provider_status = 'available', online_status = false WHERE "userId" = $1`,
    [providerId],
  );
}
