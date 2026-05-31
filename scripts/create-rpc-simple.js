require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const sql = `
DROP FUNCTION IF EXISTS get_provider_stats(UUID);

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
  const url = process.env.POSTGRES_URL_NON_POOLING?.split('?')[0];
  if (!url) { console.error('No POSTGRES_URL_NON_POOLING'); process.exit(1); }
  const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
  try {
    await pool.query(sql);
    console.log('RPC get_provider_stats created successfully');
  } catch (e) {
    console.error('Error:', e.message);
  }
  await pool.end();
})();
