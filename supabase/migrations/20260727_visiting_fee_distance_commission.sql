-- Migration: Distance-based visiting fee + 12% commission on arrival
-- Replaces the old flat-60-PKR completion commission with a real
-- distance-tiered visiting fee, charged when the provider marks arrived.
-- Fully idempotent.

-- 1. Add visiting_fee column
ALTER TABLE service_requests
  ADD COLUMN IF NOT EXISTS visiting_fee INTEGER;

-- 2. Tier lookup: <=5km -> 500, <=10km -> 1000, >10km -> 1500
CREATE OR REPLACE FUNCTION calculate_visiting_fee(p_distance_km NUMERIC)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_distance_km IS NULL THEN
    RETURN 1500;
  ELSIF p_distance_km <= 5 THEN
    RETURN 500;
  ELSIF p_distance_km <= 10 THEN
    RETURN 1000;
  ELSE
    RETURN 1500;
  END IF;
END;
$$;

-- 3. accept_service_request — compute + store visiting_fee at accept time
DROP FUNCTION IF EXISTS accept_service_request(UUID, UUID);
CREATE OR REPLACE FUNCTION accept_service_request(
    p_provider_id UUID,
    p_request_id UUID
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    updated_request JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
    affected_rows INTEGER;
    current_request RECORD;
    v_provider_location GEOGRAPHY;
    v_distance_km NUMERIC;
    v_visiting_fee INTEGER;
BEGIN
    SELECT location INTO v_provider_location
    FROM ustaz_registrations WHERE "userId" = p_provider_id;

    UPDATE service_requests
    SET
        status = 'accepted',
        accepted_by_provider_id = p_provider_id,
        updated_at = NOW()
    WHERE
        id = p_request_id
        AND status = 'notified_multiple'
    RETURNING * INTO current_request;

    GET DIAGNOSTICS affected_rows = ROW_COUNT;

    IF affected_rows = 0 THEN
        SELECT * INTO current_request FROM service_requests WHERE id = p_request_id;

        IF current_request.status = 'accepted' THEN
            RETURN QUERY SELECT FALSE, 'Request already accepted by another provider', NULL::JSONB;
        ELSE
            RETURN QUERY SELECT FALSE, 'Request no longer available', NULL::JSONB;
        END IF;
    ELSE
        IF v_provider_location IS NOT NULL THEN
          v_distance_km := ST_Distance(
            v_provider_location,
            ST_MakePoint(current_request.request_longitude, current_request.request_latitude)::geography
          ) / 1000.0;
        ELSE
          v_distance_km := NULL;
        END IF;

        v_visiting_fee := calculate_visiting_fee(v_distance_km);

        UPDATE service_requests
        SET visiting_fee = v_visiting_fee
        WHERE id = p_request_id
        RETURNING * INTO current_request;

        UPDATE ustaz_registrations
        SET provider_status = 'busy'
        WHERE "userId" = p_provider_id;

        UPDATE notifications
        SET
            status = CASE
                WHEN recipient_user_id = p_provider_id THEN 'accepted'
                ELSE 'taken_by_other'
            END,
            updated_at = NOW()
        WHERE request_id = p_request_id;

        RETURN QUERY SELECT TRUE, 'Request accepted successfully', row_to_json(current_request)::JSONB;
    END IF;
END;
$$;

-- 4. update_request_to_arrived — deduct 12% commission on the visiting fee
DROP FUNCTION IF EXISTS update_request_to_arrived(UUID, UUID);
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
  v_visiting_fee INTEGER;
  v_balance_before INTEGER := 0;
  v_commission INTEGER := 0;
  v_balance_after INTEGER := 0;
BEGIN
  SELECT status, accepted_by_provider_id, visiting_fee
  INTO current_status, current_provider, v_visiting_fee
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

  IF affected > 0 AND v_visiting_fee IS NOT NULL THEN
    INSERT INTO provider_wallets (provider_id, balance, total_earned, total_commission_paid)
    VALUES (p_provider_id, 0, 0, 0)
    ON CONFLICT (provider_id) DO NOTHING;

    SELECT balance INTO v_balance_before
    FROM provider_wallets WHERE provider_id = p_provider_id;

    v_commission := LEAST(ROUND(v_visiting_fee * 0.12), v_balance_before);
    v_balance_after := v_balance_before - v_commission;

    IF v_commission > 0 THEN
      UPDATE provider_wallets
      SET balance = balance - v_commission,
          total_commission_paid = total_commission_paid + v_commission,
          updated_at = NOW()
      WHERE provider_id = p_provider_id;

      INSERT INTO wallet_transactions (provider_id, type, amount, balance_before, balance_after, request_id, description)
      VALUES (p_provider_id, 'commission', -v_commission, v_balance_before, v_balance_after,
              p_request_id, format('12%% commission on Rs.%s visiting fee (%s PKR deducted)', v_visiting_fee, v_commission));
    END IF;
  END IF;

  RETURN QUERY SELECT affected > 0, CASE WHEN affected > 0 THEN 'Arrived' ELSE 'Update failed' END;
END;
$$;

-- 5. complete_service — remove the old flat-60-PKR commission block
DROP FUNCTION IF EXISTS complete_service(UUID, UUID);
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

  GET DIAGNOSTICS affected = ROW_COUNT;

  UPDATE ustaz_registrations
  SET provider_status = 'available'
  WHERE "userId" = p_provider_id;

  DELETE FROM live_locations WHERE request_id = p_request_id;

  RETURN QUERY SELECT affected > 0, CASE WHEN affected > 0 THEN 'Service completed' ELSE 'Update failed' END;
END;
$$;
