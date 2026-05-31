const fs = require('fs');
const { Pool } = require('pg');
const env = fs.readFileSync('.env.local', 'utf8');
const m = env.match(/POSTGRES_URL_NON_POOLING=\\"?([^"\\n]+)/);
if (!m) { console.error('No POSTGRES_URL_NON_POOLING found in .env.local'); process.exit(1); }
const url = m[1].trim().split('?')[0];

const sql = `
CREATE OR REPLACE FUNCTION get_provider_stats(p_provider_id UUID)
RETURNS TABLE(
  avg_rating NUMERIC(3,2),
  total_ratings INTEGER,
  completed_jobs BIGINT
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN QUERY SELECT 0.00::NUMERIC(3,2), 0::INTEGER, 0::BIGINT;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(r.rating_avg, 0.00)::NUMERIC(3,2) AS avg_rating,
    r.rating_count AS total_ratings,
    (SELECT COUNT(*)::BIGINT
     FROM service_requests
     WHERE accepted_by_provider_id = p_provider_id
       AND status = 'completed') AS completed_jobs
  FROM ustaz_registrations r
  WHERE r."userId" = p_provider_id;
END;
$$;
`;

(async () => {
  const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
  try {
    await pool.query(sql);
    console.log('RPC get_provider_stats created successfully');
  } catch (e) {
    console.error('Error:', e.message);
  }
  await pool.end();
})();
