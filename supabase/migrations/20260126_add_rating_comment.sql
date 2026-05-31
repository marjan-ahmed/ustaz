-- =============================================================
-- Migration: Add optional comment to customer ratings
-- =============================================================

-- Add comment column to service_requests for customer ratings
ALTER TABLE service_requests
  ADD COLUMN IF NOT EXISTS customer_rating_comment TEXT;

-- ---------------------------------------------------------
-- RPC: rate_user  — updated to accept optional p_comment
-- ---------------------------------------------------------
DROP FUNCTION IF EXISTS rate_user(UUID, UUID, SMALLINT);

CREATE OR REPLACE FUNCTION rate_user(
  p_request_id UUID,
  p_rater_id UUID,
  p_rating SMALLINT,
  p_comment TEXT DEFAULT NULL
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
    SET customer_rated          = true,
        customer_rating_value   = p_rating,
        customer_rating_comment = p_comment,
        updated_at              = NOW()
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
