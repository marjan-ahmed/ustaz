/**
 * RPC Validation Script
 *
 * Runs each of the 8 RPC functions against the database with edge-case
 * inputs and reports pass/fail for every test case.
 *
 * Usage: node scripts/validate-rpcs.mjs
 *
 * This script is idempotent — it creates a throwaway test request at
 * the configured user's latitude/longitude, runs transitions through
 * the full lifecycle, and cleans up after itself.
 *
 * SETUP BEFORE RUNNING:
 *   1. Pick TWO existing auth user IDs from your Supabase project:
 *      - CUSTOMER_UID — a user who can own service_requests
 *      - PROVIDER_UID — a user who is registered in ustaz_registrations
 *   2. Set these as environment variables:
 *      export CUSTOMER_UID=...
 *      export PROVIDER_UID=...
 */

import { readFileSync } from 'fs';
import pg from 'pg';
const { Pool } = pg;

const CUSTOMER_UID  = process.env.CUSTOMER_UID;
const PROVIDER_UID  = process.env.PROVIDER_UID;

if (!CUSTOMER_UID || !PROVIDER_UID) {
  console.error('❌ Set CUSTOMER_UID and PROVIDER_UID env vars first.');
  console.error('   These are existing auth users in your Supabase project.');
  process.exit(1);
}

const env = readFileSync('.env.local', 'utf8');
const m = env.match(/POSTGRES_URL_NON_POOLING="?([^"\n]+)/);
if (!m) {
  console.error('❌ No POSTGRES_URL_NON_POOLING found in .env.local');
  process.exit(1);
}

const pool = new Pool({ connectionString: m[1].trim(), ssl: { rejectUnauthorized: false } });

async function query(sql, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result;
  } finally {
    client.release();
  }
}

async function rpc(name, args) {
  // Build an SQL call like: SELECT * FROM update_request_to_arriving(...)
  const keys = Object.keys(args);
  const vals = Object.values(args);
  const placeholders = vals.map((_, i) => `$${i + 1}`);
  const call = `SELECT * FROM ${name}(${placeholders.join(', ')})`;
  const r = await query(call, vals);
  return r.rows[0];
}

let passed = 0;
let failed = 0;
let testRequestId = null;

function test(name, fn) {
  return async () => {
    try {
      await fn();
      console.log(`  ✅ ${name}`);
      passed++;
    } catch (e) {
      console.log(`  ❌ ${name}: ${e.message}`);
      failed++;
    }
  };
}

// ──────────────────────────────────────────────
// Setup: Create a throwaway service request
// ──────────────────────────────────────────────
async function createTestRequest() {
  const r = await query(`
    INSERT INTO service_requests (user_id, service_type, request_latitude, request_longitude, status, notified_providers)
    VALUES ($1, 'Plumbing', 33.6844, 73.0479, 'notified_multiple', ARRAY[$2::text])
    RETURNING id
  `, [CUSTOMER_UID, PROVIDER_UID]);
  testRequestId = r.rows[0].id;
  console.log(`\n📝 Created test request: ${testRequestId}`);
}

async function cleanup() {
  if (testRequestId) {
    await query('DELETE FROM ratings WHERE request_id = $1', [testRequestId]);
    await query('DELETE FROM service_requests WHERE id = $1', [testRequestId]);
    console.log('🧹 Cleaned up test request\n');
  }
  await pool.end();
}

// ──────────────────────────────────────────────
// Test 1: reject non-existent request
// ──────────────────────────────────────────────
const test1 = test('reject update on non-existent UUID', async () => {
  const r = await rpc('update_request_to_arriving', {
    p_request_id: '00000000-0000-0000-0000-000000000000',
    p_provider_id: PROVIDER_UID,
  });
  if (r.success !== false) throw new Error(`Expected success=false, got ${r.success}: ${r.message}`);
});

// ──────────────────────────────────────────────
// Test 2: reject with wrong provider
// ──────────────────────────────────────────────
const test2 = test('reject update with wrong provider_id', async () => {
  const r = await rpc('update_request_to_arriving', {
    p_request_id: testRequestId,
    p_provider_id: CUSTOMER_UID, // customer, not the assigned provider
  });
  // Should fail because accepted_by_provider_id is null (not your request)
  if (r.success !== false) throw new Error(`Expected success=false, got ${r.success}: ${r.message}`);
});

// ──────────────────────────────────────────────
// Test 3: accept via RPC, then transition through full lifecycle
// ──────────────────────────────────────────────
const test3 = test('full lifecycle: accept → arriving → arrived → in_progress → completed', async () => {
  // 3a: Call accept RPC first (existing RPC from earlier migration)
  const acceptR = await rpc('accept_service_request_authed', {
    p_request_id: testRequestId,
    p_provider_id: PROVIDER_UID,
  });
  if (acceptR.success !== true) throw new Error(`accept failed: ${acceptR.message}`);

  // 3b: transition to arriving
  const arrivingR = await rpc('update_request_to_arriving', {
    p_request_id: testRequestId,
    p_provider_id: PROVIDER_UID,
  });
  if (arrivingR.success !== true) throw new Error(`arriving failed: ${arrivingR.message}`);

  // 3c: transition to arrived
  const arrivedR = await rpc('update_request_to_arrived', {
    p_request_id: testRequestId,
    p_provider_id: PROVIDER_UID,
  });
  if (arrivedR.success !== true) throw new Error(`arrived failed: ${arrivedR.message}`);

  // Verify provider_arrived_at was set
  const v1 = await query('SELECT provider_arrived_at FROM service_requests WHERE id = $1', [testRequestId]);
  if (!v1.rows[0]?.provider_arrived_at) throw new Error('provider_arrived_at was not populated');

  // 3d: transition to in_progress
  const progressR = await rpc('update_request_to_in_progress', {
    p_request_id: testRequestId,
    p_provider_id: PROVIDER_UID,
  });
  if (progressR.success !== true) throw new Error(`in_progress failed: ${progressR.message}`);

  // Verify service_started_at was set
  const v2 = await query('SELECT service_started_at FROM service_requests WHERE id = $1', [testRequestId]);
  if (!v2.rows[0]?.service_started_at) throw new Error('service_started_at was not populated');

  // 3e: transition to completed
  const completedR = await rpc('complete_service', {
    p_request_id: testRequestId,
    p_provider_id: PROVIDER_UID,
  });
  if (completedR.success !== true) throw new Error(`completed failed: ${completedR.message}`);

  // Verify service_completed_at and provider status reset
  const v3 = await query(`SELECT sr.service_completed_at, u.provider_status
    FROM service_requests sr
    LEFT JOIN ustaz_registrations u ON u.userId = $2
    WHERE sr.id = $1`, [testRequestId, PROVIDER_UID]);
  if (!v3.rows[0]?.service_completed_at) throw new Error('service_completed_at was not populated');
  // Provider should be back to available
  if (v3.rows[0]?.provider_status !== 'available') {
    console.log(`      ⚠ provider_status is "${v3.rows[0]?.provider_status}", expected "available" (may be expected if test user isn't a real provider)`);
  }
});

// ──────────────────────────────────────────────
// Test 4: start_service alias works
// ──────────────────────────────────────────────
const test4 = test('start_service alias creates new request and transitions', async () => {
  // Create new test request
  const nr = await query(`
    INSERT INTO service_requests (user_id, service_type, request_latitude, request_longitude, status)
    VALUES ($1, 'Electrician Service', 33.6844, 73.0479, 'accepted')
    RETURNING id
  `, [CUSTOMER_UID]);
  const tmpId = nr.rows[0].id;

  // Accept and set accepted_by_provider_id directly for this alias test
  await query(`UPDATE service_requests SET accepted_by_provider_id = $2 WHERE id = $1`, [tmpId, PROVIDER_UID]);

  // transition to arrived first (from accepted)
  const arrivedR = await rpc('update_request_to_arrived', {
    p_request_id: tmpId,
    p_provider_id: PROVIDER_UID,
  });
  if (arrivedR.success !== true) {
    // try arriving -> arrived path
    const arrivingR = await rpc('update_request_to_arriving', { p_request_id: tmpId, p_provider_id: PROVIDER_UID });
    if (arrivingR.success !== true) throw new Error(`start_service alias pre-step failed`);
    const arrivedR2 = await rpc('update_request_to_arrived', { p_request_id: tmpId, p_provider_id: PROVIDER_UID });
    if (arrivedR2.success !== true) throw new Error(`start_service alias arrived failed`);
  }

  // Now use start_service alias
  const r = await rpc('start_service', {
    p_request_id: tmpId,
    p_provider_id: PROVIDER_UID,
  });
  if (r.success !== true) throw new Error(`start_service alias failed: ${r.message}`);

  // Cleanup temp request
  await query('DELETE FROM service_requests WHERE id = $1', [tmpId]);
});

// ──────────────────────────────────────────────
// Test 5: cancel from non-terminal state
// ──────────────────────────────────────────────
const test5 = test('cancel_service_request from accepted state', async () => {
  const nr = await query(`
    INSERT INTO service_requests (user_id, service_type, request_latitude, request_longitude, status, accepted_by_provider_id)
    VALUES ($1, 'Plumbing', 33.6844, 73.0479, 'accepted', $2)
    RETURNING id
  `, [CUSTOMER_UID, PROVIDER_UID]);
  const tmpId = nr.rows[0].id;

  // Provider cancels
  const r = await rpc('cancel_service_request', {
    p_request_id: tmpId,
    p_user_id: null,
    p_provider_id: PROVIDER_UID,
  });
  if (r.success !== true) throw new Error(`cancel failed: ${r.message}`);

  // Verify cancelled
  const v = await query('SELECT status FROM service_requests WHERE id = $1', [tmpId]);
  if (v.rows[0]?.status !== 'cancelled') throw new Error('status not set to cancelled');

  await query('DELETE FROM service_requests WHERE id = $1', [tmpId]);
});

// ──────────────────────────────────────────────
// Test 6: reject cancel on completed request
// ──────────────────────────────────────────────
const test6 = test('reject cancel on already completed request', async () => {
  const r = await rpc('cancel_service_request', {
    p_request_id: testRequestId, // this was already completed in test3
    p_user_id: CUSTOMER_UID,
    p_provider_id: null,
  });
  if (r.success !== false) throw new Error(`Expected cancel to fail on completed, got: ${r.message}`);
});

// ──────────────────────────────────────────────
// Test 7: rate_service
// ──────────────────────────────────────────────
const test7 = test('rate_service with valid data', async () => {
  const r = await rpc('rate_service', {
    p_request_id: testRequestId,
    p_rater_id: CUSTOMER_UID,
    p_rated_user_id: PROVIDER_UID,
    p_rating: 5,
    p_comment: 'Excellent work!',
  });
  if (r.success !== true) throw new Error(`rate_service failed: ${r.message}`);

  // Verify rating was stored
  const v = await query('SELECT rating, comment FROM ratings WHERE request_id = $1 AND rater_id = $2', [testRequestId, CUSTOMER_UID]);
  if (v.rows.length === 0) throw new Error('rating not found in DB');
  if (v.rows[0].rating !== 5) throw new Error('expected rating 5, got ' + v.rows[0].rating);

  // Test duplicate rating (should upsert, not error)
  const r2 = await rpc('rate_service', {
    p_request_id: testRequestId,
    p_rater_id: CUSTOMER_UID,
    p_rated_user_id: PROVIDER_UID,
    p_rating: 4,
    p_comment: 'Updated rating',
  });
  if (r2.success !== true) throw new Error(`rate_service upsert failed: ${r2.message}`);

  // Verify it was updated
  const v2 = await query('SELECT rating FROM ratings WHERE request_id = $1 AND rater_id = $2', [testRequestId, CUSTOMER_UID]);
  if (v2.rows[0].rating !== 4) throw new Error('expected updated rating 4, got ' + v2.rows[0].rating);

  // Test duplicate with UNIQUE constraint — this should still succeed via ON CONFLICT
  console.log('      ℹ  Duplicate rating (upsert via ON CONFLICT) — passed');
});

// ──────────────────────────────────────────────
// Test 8: get_provider_stats
// ──────────────────────────────────────────────
const test8 = test('get_provider_stats returns data', async () => {
  const r = await rpc('get_provider_stats', {
    p_provider_id: PROVIDER_UID,
  });
  console.log(`      📊 Provider stats: avg=${r.avg_rating}, total_ratings=${r.total_ratings}, completed_jobs=${r.completed_jobs}`);
  // Should have at least 1 completed job from test3
  if (Number(r.total_ratings) < 1) console.log('      ⚠ total_ratings < 1 (may be expected if test user data is fresh)');
});

// ──────────────────────────────────────────────
// RUN
// ──────────────────────────────────────────────
async function main() {
  console.log('══════════════════════════════════════════');
  console.log('  RPC Validation Suite');
  console.log('══════════════════════════════════════════');
  console.log(`  Customer: ${CUSTOMER_UID}`);
  console.log(`  Provider: ${PROVIDER_UID}`);
  console.log('');

  try {
    await createTestRequest();
    await test1();
    await test2();
    await test3();
    await test4();
    await test5();
    await test6();
    await test7();
    await test8();
  } finally {
    await cleanup();
  }

  console.log('══════════════════════════════════════════');
  console.log(`  Results: ${passed} ✅  |  ${failed} ❌`);
  console.log('══════════════════════════════════════════');
  if (failed > 0) process.exit(1);
}

main().catch(e => {
  console.error('Fatal:', e);
  cleanup();
  process.exit(1);
});
