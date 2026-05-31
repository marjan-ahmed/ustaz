-- =============================================================
-- Migration: Arrival workflow + Service timer + Rating system
-- Fully idempotent — safe to run multiple times
-- =============================================================

-- Drop existing RPCs dynamically (their exact signatures may differ from a partial run)
-- CREATE OR REPLACE cannot change return type, so we must DROP first
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT oid, proname, pg_get_function_identity_arguments(oid) AS args
    FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace
      AND proname IN (
        'update_request_to_arriving',
        'update_request_to_arrived',
        'update_request_to_in_progress',
        'start_service',
        'complete_service',
        'cancel_service_request',
        'rate_service',
        'get_provider_stats'
      )
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.proname || '(' || COALESCE(r.args, '') || ') CASCADE';
  END LOOP;
END;
$$;

-- ---------------------------------------------------------
-- 1. Add service timer columns to service_requests
-- ---------------------------------------------------------
ALTER TABLE service_requests
  ADD COLUMN IF NOT EXISTS provider_arrived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS service_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS service_completed_at TIMESTAMPTZ;

-- ---------------------------------------------------------
-- 2. Create ratings table
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS ratings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id    UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  rater_id      UUID NOT NULL,
  rated_user_id UUID NOT NULL,
  rating        SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(request_id, rater_id)  -- one rating per user per request
);

-- Enable RLS (safe to run multiple times)
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Idempotent policy creation (PostgreSQL has no CREATE POLICY IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ratings' AND policyname = 'Users can insert their own ratings'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can insert their own ratings" ON ratings FOR INSERT WITH CHECK (auth.uid() = rater_id)';
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ratings' AND policyname = 'Users can read ratings for their requests'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can read ratings for their requests" ON ratings FOR SELECT USING (
      auth.uid() = rater_id OR
      auth.uid() = rated_user_id OR
      EXISTS (
        SELECT 1 FROM service_requests sr
        WHERE sr.id = request_id AND (sr.user_id = auth.uid() OR sr.accepted_by_provider_id = auth.uid())
      )
    )';
  END IF;
END;
$$;

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_ratings_request_id ON ratings(request_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rated_user_id ON ratings(rated_user_id);

-- ---------------------------------------------------------
-- 3. RPC: update_request_to_arriving
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION update_request_to_arriving(
  p_request_id UUID,
  p_provider_id UUID
)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  affected INTEGER;
  current_status TEXT;
  current_provider UUID;
BEGIN
  SELECT status, accepted_by_provider_id INTO current_status, current_provider
  FROM service_requests WHERE id = p_request_id;

  IF current_status IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Request not found'::TEXT;
    RETURN;
  END IF;

  IF auth.uid() != p_provider_id THEN
    RETURN QUERY SELECT FALSE, 'Not authenticated as this provider'::TEXT;
    RETURN;
  END IF;

  IF current_provider != p_provider_id THEN
    RETURN QUERY SELECT FALSE, 'Not your request'::TEXT;
    RETURN;
  END IF;

  IF current_status NOT IN ('accepted', 'provider_enroute') THEN
    RETURN QUERY SELECT FALSE, format('Cannot transition from %s to arriving', current_status)::TEXT;
    RETURN;
  END IF;

  UPDATE service_requests
  SET status = 'arriving',
      updated_at = NOW()
  WHERE id = p_request_id
    AND accepted_by_provider_id = p_provider_id;

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN QUERY SELECT affected > 0, CASE WHEN affected > 0 THEN 'Arriving' ELSE 'Update failed' END;
END;
$$;

-- ---------------------------------------------------------
-- 4. RPC: update_request_to_arrived
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION update_request_to_arrived(
  p_request_id UUID,
  p_provider_id UUID
)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  affected INTEGER;
  current_status TEXT;
  current_provider UUID;
BEGIN
  SELECT status, accepted_by_provider_id INTO current_status, current_provider
  FROM service_requests WHERE id = p_request_id;

  IF current_status IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Request not found'::TEXT;
    RETURN;
  END IF;

  IF auth.uid() != p_provider_id THEN
    RETURN QUERY SELECT FALSE, 'Not authenticated as this provider'::TEXT;
    RETURN;
  END IF;

  IF current_provider != p_provider_id THEN
    RETURN QUERY SELECT FALSE, 'Not your request'::TEXT;
    RETURN;
  END IF;

  IF current_status NOT IN ('accepted', 'provider_enroute', 'arriving') THEN
    RETURN QUERY SELECT FALSE, format('Cannot transition from %s to arrived', current_status)::TEXT;
    RETURN;
  END IF;

  UPDATE service_requests
  SET status = 'arrived',
      provider_arrived_at = NOW(),
      updated_at = NOW()
  WHERE id = p_request_id
    AND accepted_by_provider_id = p_provider_id;

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN QUERY SELECT affected > 0, CASE WHEN affected > 0 THEN 'Arrived' ELSE 'Update failed' END;
END;
$$;

-- ---------------------------------------------------------
-- 5. RPC: update_request_to_in_progress
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION update_request_to_in_progress(
  p_request_id UUID,
  p_provider_id UUID
)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  affected INTEGER;
  current_status TEXT;
  current_provider UUID;
BEGIN
  SELECT status, accepted_by_provider_id INTO current_status, current_provider
  FROM service_requests WHERE id = p_request_id;

  IF current_status IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Request not found'::TEXT;
    RETURN;
  END IF;

  IF current_provider != p_provider_id THEN
    RETURN QUERY SELECT FALSE, 'Not your request'::TEXT;
    RETURN;
  END IF;

  IF current_status NOT IN ('arrived', 'accepted') THEN
    RETURN QUERY SELECT FALSE, format('Cannot transition from %s to in_progress', current_status)::TEXT;
    RETURN;
  END IF;

  UPDATE service_requests
  SET status = 'in_progress',
      service_started_at = NOW(),
      updated_at = NOW()
  WHERE id = p_request_id
    AND accepted_by_provider_id = p_provider_id;

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN QUERY SELECT affected > 0, CASE WHEN affected > 0 THEN 'Service in progress' ELSE 'Update failed' END;
END;
$$;

-- ---------------------------------------------------------
-- 6. RPC: start_service (alias for update_request_to_in_progress)
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION start_service(
  p_request_id UUID,
  p_provider_id UUID
)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  affected INTEGER;
  current_status TEXT;
  current_provider UUID;
BEGIN
  SELECT status, accepted_by_provider_id INTO current_status, current_provider
  FROM service_requests WHERE id = p_request_id;

  IF current_status IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Request not found'::TEXT;
    RETURN;
  END IF;

  IF current_provider != p_provider_id THEN
    RETURN QUERY SELECT FALSE, 'Not your request'::TEXT;
    RETURN;
  END IF;

  IF current_status NOT IN ('arrived', 'accepted') THEN
    RETURN QUERY SELECT FALSE, format('Cannot transition from %s to in_progress', current_status)::TEXT;
    RETURN;
  END IF;

  UPDATE service_requests
  SET status = 'in_progress',
      service_started_at = NOW(),
      updated_at = NOW()
  WHERE id = p_request_id
    AND accepted_by_provider_id = p_provider_id;

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN QUERY SELECT affected > 0, CASE WHEN affected > 0 THEN 'Service started' ELSE 'Update failed' END;
END;
$$;

-- ---------------------------------------------------------
-- 7. RPC: complete_service
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION complete_service(
  p_request_id UUID,
  p_provider_id UUID
)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  affected INTEGER;
  current_status TEXT;
  current_provider UUID;
BEGIN
  SELECT status, accepted_by_provider_id INTO current_status, current_provider
  FROM service_requests WHERE id = p_request_id;

  IF current_status IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Request not found'::TEXT;
    RETURN;
  END IF;

  IF current_provider != p_provider_id THEN
    RETURN QUERY SELECT FALSE, 'Not your request'::TEXT;
    RETURN;
  END IF;

  IF current_status NOT IN ('in_progress', 'work_in_progress') THEN
    RETURN QUERY SELECT FALSE, format('Cannot complete from %s', current_status)::TEXT;
    RETURN;
  END IF;

  UPDATE service_requests
  SET status = 'completed',
      service_completed_at = NOW(),
      updated_at = NOW()
  WHERE id = p_request_id
    AND accepted_by_provider_id = p_provider_id;

  -- Set provider back to available
  UPDATE ustaz_registrations
  SET provider_status = 'available'
  WHERE "userId" = p_provider_id;

  -- Clean up live_locations for this request
  DELETE FROM live_locations WHERE request_id = p_request_id;

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN QUERY SELECT affected > 0, CASE WHEN affected > 0 THEN 'Service completed' ELSE 'Update failed' END;
END;
$$;

-- ---------------------------------------------------------
-- 8. RPC: cancel_service_request
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION cancel_service_request(
  p_request_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_provider_id UUID DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  affected INTEGER;
  current_status TEXT;
  current_user_id UUID;
  current_provider UUID;
BEGIN
  SELECT status, user_id, accepted_by_provider_id
  INTO current_status, current_user_id, current_provider
  FROM service_requests WHERE id = p_request_id;

  IF current_status IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Request not found'::TEXT;
    RETURN;
  END IF;

  IF auth.uid() IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Not authenticated'::TEXT;
    RETURN;
  END IF;

  IF auth.uid() != COALESCE(p_user_id, p_provider_id) THEN
    RETURN QUERY SELECT FALSE, 'Not authorized to cancel this request'::TEXT;
    RETURN;
  END IF;

  IF p_user_id IS NOT NULL AND p_user_id != current_user_id THEN
    RETURN QUERY SELECT FALSE, 'Not authorized to cancel this request'::TEXT;
    RETURN;
  END IF;

  IF p_provider_id IS NOT NULL AND p_provider_id != current_provider THEN
    RETURN QUERY SELECT FALSE, 'Not authorized to cancel this request'::TEXT;
    RETURN;
  END IF;

  IF p_user_id IS NULL AND p_provider_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Must provide either user_id or provider_id'::TEXT;
    RETURN;
  END IF;

  IF current_status IN ('completed', 'cancelled') THEN
    RETURN QUERY SELECT FALSE, format('Cannot cancel — request is already %s', current_status)::TEXT;
    RETURN;
  END IF;

  UPDATE service_requests
  SET status = 'cancelled',
      updated_at = NOW()
  WHERE id = p_request_id
    AND (p_user_id IS NULL OR user_id = p_user_id)
    AND (p_provider_id IS NULL OR accepted_by_provider_id = p_provider_id);

  GET DIAGNOSTICS affected = ROW_COUNT;

  IF p_provider_id IS NOT NULL AND affected > 0 THEN
    UPDATE ustaz_registrations
    SET provider_status = 'available'
    WHERE "userId" = p_provider_id;
  END IF;

  RETURN QUERY SELECT affected > 0, CASE WHEN affected > 0 THEN 'Request cancelled' ELSE 'Update failed' END;
END;
$$;

-- ---------------------------------------------------------
-- 9. RPC: rate_service
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION rate_service(
  p_request_id UUID,
  p_rater_id UUID,
  p_rated_user_id UUID,
  p_rating SMALLINT,
  p_comment TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF auth.uid() != p_rater_id THEN
    RETURN QUERY SELECT FALSE, 'Not authenticated as this rater'::TEXT;
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM service_requests
    WHERE id = p_request_id AND status = 'completed'
  ) THEN
    RETURN QUERY SELECT FALSE, 'Request must be completed to rate'::TEXT;
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM service_requests
    WHERE id = p_request_id
      AND (user_id = p_rater_id OR accepted_by_provider_id = p_rater_id)
  ) THEN
    RETURN QUERY SELECT FALSE, 'You are not part of this request'::TEXT;
    RETURN;
  END IF;

  INSERT INTO ratings (request_id, rater_id, rated_user_id, rating, comment)
  VALUES (p_request_id, p_rater_id, p_rated_user_id, p_rating, p_comment)
  ON CONFLICT (request_id, rater_id)
  DO UPDATE SET rating = p_rating, comment = p_comment, created_at = NOW();

  RETURN QUERY SELECT TRUE, 'Rating submitted'::TEXT;
END;
$$;

-- ---------------------------------------------------------
-- 10. RPC: get_provider_stats
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION get_provider_stats(p_provider_id UUID)
RETURNS TABLE(
  avg_rating NUMERIC,
  total_ratings BIGINT,
  completed_jobs BIGINT
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN QUERY SELECT 0::NUMERIC, 0::BIGINT, 0::BIGINT;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(ROUND(AVG(r.rating)::NUMERIC, 1), 0) AS avg_rating,
    COUNT(DISTINCT r.id) AS total_ratings,
    COUNT(DISTINCT sr.id) AS completed_jobs
  FROM service_requests sr
  LEFT JOIN ratings r ON r.rated_user_id = p_provider_id
  WHERE sr.accepted_by_provider_id = p_provider_id
    AND sr.status = 'completed';
END;
$$;
