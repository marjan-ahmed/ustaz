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
  await p.query(
    `DELETE FROM ratings WHERE rater_id IN ($1, $2) OR rated_user_id IN ($1, $2)`,
    [customerUserId, providerUserId],
  );
  await p.query(
    `DELETE FROM live_locations WHERE provider_id = $1`,
    [providerUserId],
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
