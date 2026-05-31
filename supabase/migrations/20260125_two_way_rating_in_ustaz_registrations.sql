-- =============================================================
-- Migration: Two-way rating — stored in ustaz_registrations & profiles
-- No separate ratings table. Aggregates computed automatically.
-- =============================================================

-- ---------------------------------------------------------
-- 1. Add rating aggregate columns to ustaz_registrations
--    (Providers get rated by customers here)
-- ---------------------------------------------------------
ALTER TABLE ustaz_registrations
  ADD COLUMN IF NOT EXISTS rating_avg   NUMERIC(3,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS rating_count INTEGER      DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_sum   INTEGER      DEFAULT 0;

-- ---------------------------------------------------------
-- 2. Add rating aggregate columns to profiles
--    (Customers get rated by providers here — profiles table
--     is where customer metadata lives)
-- ---------------------------------------------------------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS rating_avg   NUMERIC(3,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS rating_count INTEGER      DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_sum   INTEGER      DEFAULT 0;

-- ---------------------------------------------------------
-- 3. Add two-way rating tracking columns to service_requests
-- ---------------------------------------------------------
ALTER TABLE service_requests
  ADD COLUMN IF NOT EXISTS customer_rated         BOOLEAN   DEFAULT false,
  ADD COLUMN IF NOT EXISTS provider_rated         BOOLEAN   DEFAULT false,
  ADD COLUMN IF NOT EXISTS customer_rating_value  SMALLINT,
  ADD COLUMN IF NOT EXISTS provider_rating_value  SMALLINT;

-- ---------------------------------------------------------
-- 4. RPC: rate_user  (replaces old rate_service that used `ratings` table)
--    Both parties rate each other. Target rating is stored in:
--      - ustaz_registrations if target is a provider
--      - profiles if target is a customer
--    Returns both_rated so the frontend knows if unlock is possible.
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION rate_user(
  p_request_id UUID,
  p_rater_id UUID,
  p_rating SMALLINT
)
RETURNS TABLE(success BOOLEAN, message TEXT, both_rated BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_request RECORD;
  v_target_id UUID;
  v_is_customer BOOLEAN;
  v_both_rated BOOLEAN := false;
  v_updated_sum INTEGER;
  v_updated_count INTEGER;
BEGIN
  -- Auth check
  IF auth.uid() != p_rater_id THEN
    RETURN QUERY SELECT false, 'Not authenticated as this user'::TEXT, false;
    RETURN;
  END IF;

  -- Fetch request
  SELECT * INTO v_request FROM service_requests WHERE id = p_request_id;
  IF v_request.id IS NULL THEN
    RETURN QUERY SELECT false, 'Request not found'::TEXT, false;
    RETURN;
  END IF;

  -- Must be completed
  IF v_request.status != 'completed' THEN
    RETURN QUERY SELECT false, 'Request must be completed to rate'::TEXT, false;
    RETURN;
  END IF;

  -- Determine role & target
  IF v_request.user_id = p_rater_id THEN
    -- Customer is rating the provider
    v_target_id := v_request.accepted_by_provider_id;
    v_is_customer := true;
  ELSIF v_request.accepted_by_provider_id = p_rater_id THEN
    -- Provider is rating the customer
    v_target_id := v_request.user_id;
    v_is_customer := false;
  ELSE
    RETURN QUERY SELECT false, 'You are not part of this request'::TEXT, false;
    RETURN;
  END IF;

  -- Check for double-rate (prevent submitting twice)
  IF v_is_customer THEN
    IF v_request.customer_rated THEN
      RETURN QUERY SELECT false, 'You have already rated this provider'::TEXT, false;
      RETURN;
    END IF;
  ELSE
    IF v_request.provider_rated THEN
      RETURN QUERY SELECT false, 'You have already rated this customer'::TEXT, false;
      RETURN;
    END IF;
  END IF;

  -- Update service_requests tracking columns
  IF v_is_customer THEN
    UPDATE service_requests
    SET customer_rated        = true,
        customer_rating_value = p_rating,
        updated_at            = NOW()
    WHERE id = p_request_id;
  ELSE
    UPDATE service_requests
    SET provider_rated        = true,
        provider_rating_value = p_rating,
        updated_at            = NOW()
    WHERE id = p_request_id;
  END IF;

  -- Update the target's rating aggregate
  IF v_is_customer THEN
    -- Target is a provider → update ustaz_registrations
    UPDATE ustaz_registrations
    SET rating_sum   = rating_sum + p_rating,
        rating_count = rating_count + 1,
        rating_avg   = ROUND((rating_sum + p_rating)::NUMERIC / (rating_count + 1), 2)
    WHERE "userId" = v_target_id
    RETURNING rating_sum, rating_count INTO v_updated_sum, v_updated_count;
  ELSE
    -- Target is a customer → update profiles
    UPDATE profiles
    SET rating_sum   = rating_sum + p_rating,
        rating_count = rating_count + 1,
        rating_avg   = ROUND((rating_sum + p_rating)::NUMERIC / (rating_count + 1), 2)
    WHERE id = v_target_id
    RETURNING rating_sum, rating_count INTO v_updated_sum, v_updated_count;
  END IF;

  -- Check if both parties have now rated
  SELECT (customer_rated AND provider_rated) INTO v_both_rated
  FROM service_requests WHERE id = p_request_id;

  RETURN QUERY SELECT true, 'Rating submitted'::TEXT, COALESCE(v_both_rated, false);
END;
$$;

-- ---------------------------------------------------------
-- 5. RPC: get_user_rating  — returns rating for any user
--    Checks both ustaz_registrations (providers) and profiles (customers)
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_rating(p_user_id UUID)
RETURNS TABLE(
  avg_rating   NUMERIC(3,2),
  rating_count INTEGER
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_provider RECORD;
  v_profile RECORD;
BEGIN
  -- Try provider first
  SELECT rating_avg, rating_count INTO v_provider
  FROM ustaz_registrations WHERE "userId" = p_user_id;

  IF FOUND AND v_provider.rating_count > 0 THEN
    RETURN QUERY SELECT v_provider.rating_avg, v_provider.rating_count;
    RETURN;
  END IF;

  -- Try customer profile
  SELECT rating_avg, rating_count INTO v_profile
  FROM profiles WHERE id = p_user_id;

  IF FOUND AND v_profile.rating_count > 0 THEN
    RETURN QUERY SELECT v_profile.rating_avg, v_profile.rating_count;
    RETURN;
  END IF;

  -- No ratings yet
  RETURN QUERY SELECT 0.00::NUMERIC(3,2), 0::INTEGER;
END;
$$;

-- ---------------------------------------------------------
-- 6. RPC: get_user_rating_by_request  — returns rating for the
--    user associated with a given request (used by notification cards)
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION get_customer_rating_for_request(p_request_id UUID)
RETURNS TABLE(
  avg_rating   NUMERIC(3,2),
  rating_count INTEGER
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_customer_id UUID;
  v_profile RECORD;
BEGIN
  SELECT user_id INTO v_customer_id
  FROM service_requests WHERE id = p_request_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 0.00::NUMERIC(3,2), 0::INTEGER;
    RETURN;
  END IF;

  SELECT rating_avg, rating_count INTO v_profile
  FROM profiles WHERE id = v_customer_id;

  IF FOUND AND v_profile.rating_count > 0 THEN
    RETURN QUERY SELECT v_profile.rating_avg, v_profile.rating_count;
    RETURN;
  END IF;

  RETURN QUERY SELECT 0.00::NUMERIC(3,2), 0::INTEGER;
END;
$$;
