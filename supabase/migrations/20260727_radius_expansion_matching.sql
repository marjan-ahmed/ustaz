-- Migration: Sequential radius-expansion matching (5km -> 10km -> 15km)
-- Tries the nearest tier first; only widens if that tier finds zero providers.
-- Tiers match the visiting-fee tiers for consistency. visiting_fee itself needs
-- no change — it's computed from the real accepted distance regardless of
-- which tier matched.

CREATE OR REPLACE FUNCTION public.create_service_request_with_notifications(
  p_service_type text,
  p_request_latitude double precision,
  p_request_longitude double precision,
  p_request_details text,
  p_radius_meters integer,
  p_landmark text DEFAULT NULL::text,
  p_entrance_photo_url text DEFAULT NULL::text
)
RETURNS TABLE(request_id uuid, notified_count bigint, providers_notified uuid[])
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_request_id UUID;
  v_notified_ids UUID[];
  v_notified_count BIGINT;
  v_address TEXT;
  v_radius_m INTEGER;
  v_tier_radii INTEGER[] := ARRAY[5000, 10000, 15000];
BEGIN
  v_address := COALESCE(p_request_details, 'Location marked on map');

  INSERT INTO public.service_requests (
    user_id, service_type, address, request_latitude, request_longitude,
    request_details, status, landmark, entrance_photo_url
  ) VALUES (
    auth.uid(), p_service_type, v_address, p_request_latitude, p_request_longitude,
    p_request_details, 'notified_multiple', p_landmark, p_entrance_photo_url
  ) RETURNING id INTO v_request_id;

  -- Try nearest tier first; widen only if the previous tier found nobody
  FOREACH v_radius_m IN ARRAY v_tier_radii
  LOOP
    WITH nearby AS (
      SELECT u."userId" AS uid
      FROM public.ustaz_registrations u
      JOIN public.provider_wallets pw ON pw.provider_id = u."userId"
      WHERE (
        p_service_type = ANY(u.service_types)
        OR u.service_type = p_service_type
      )
        AND u."userId" != auth.uid()
        AND COALESCE(u.online_status, false) = true
        AND COALESCE(u.provider_status, 'available') = 'available'
        AND u.location IS NOT NULL
        AND pw.balance >= 60
        AND ST_DWithin(
          u.location,
          ST_SetSRID(ST_MakePoint(p_request_longitude, p_request_latitude), 4326)::geography,
          v_radius_m
        )
      ORDER BY ST_Distance(
        u.location,
        ST_SetSRID(ST_MakePoint(p_request_longitude, p_request_latitude), 4326)::geography
      )
      LIMIT 20
    )
    SELECT array_agg(uid), COUNT(*)
    INTO v_notified_ids, v_notified_count
    FROM nearby;

    EXIT WHEN v_notified_count > 0;
  END LOOP;

  UPDATE public.service_requests
  SET notified_providers = COALESCE(v_notified_ids, ARRAY[]::UUID[])
  WHERE id = v_request_id;

  IF v_notified_ids IS NOT NULL AND array_length(v_notified_ids, 1) > 0 THEN
    INSERT INTO public.notifications (recipient_user_id, sender_user_id, service_type, message, address, request_id, user_location)
    SELECT
      unnest(v_notified_ids),
      auth.uid(),
      p_service_type,
      p_request_details || CASE WHEN p_landmark IS NOT NULL THEN ' (Landmark: ' || p_landmark || ')' ELSE '' END,
      v_address,
      v_request_id,
      ST_Y(ST_SetSRID(ST_MakePoint(p_request_longitude, p_request_latitude), 4326)::geometry)::TEXT || ',' || ST_X(ST_SetSRID(ST_MakePoint(p_request_longitude, p_request_latitude), 4326)::geometry)::TEXT;
  END IF;

  RETURN QUERY SELECT v_request_id, COALESCE(v_notified_count, 0), COALESCE(v_notified_ids, ARRAY[]::UUID[]);
END;
$function$;
