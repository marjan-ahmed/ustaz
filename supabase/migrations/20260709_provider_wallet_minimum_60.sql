-- Enforce a Rs. 60 minimum provider wallet balance before providers can
-- receive or accept service requests.

CREATE OR REPLACE FUNCTION public.find_providers_nearby(
  p_lat double precision,
  p_lng double precision,
  p_radius_m integer,
  p_service text
)
RETURNS TABLE(user_id uuid, distance_m double precision, online boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  select u."userId"::uuid,
         st_distance(u.location, st_makepoint(p_lng, p_lat)::geography),
         coalesce(u.online_status, false)
    from public.ustaz_registrations u
    join public.provider_wallets pw
      on pw.provider_id = u."userId"
     and pw.balance >= 60
   where u.service_type = p_service
     and coalesce(u.online_status, false) = true
     and u.location is not null
     and st_dwithin(u.location, st_makepoint(p_lng, p_lat)::geography, p_radius_m)
   order by 2
   limit 20;
$function$;

CREATE OR REPLACE FUNCTION public.update_provider_online_status(
  p_user_id uuid,
  p_online boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_balance integer;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Not authorized to update this provider status';
  END IF;

  INSERT INTO public.provider_wallets (provider_id, balance, total_earned, total_commission_paid)
  VALUES (p_user_id, 0, 0, 0)
  ON CONFLICT (provider_id) DO NOTHING;

  IF p_online THEN
    SELECT balance INTO v_balance
    FROM public.provider_wallets
    WHERE provider_id = p_user_id;

    IF COALESCE(v_balance, 0) < 60 THEN
      RAISE EXCEPTION 'Insufficient balance: keep at least Rs. 60 in your wallet to receive service requests. Current balance: Rs. %', COALESCE(v_balance, 0);
    END IF;
  END IF;

  UPDATE public.ustaz_registrations
  SET
    online_status = p_online,
    last_seen_at = now(),
    provider_status = CASE
      WHEN p_online THEN 'available'
      ELSE 'offline'
    END
  WHERE "userId" = p_user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.accept_service_request_authed(p_request_id uuid)
RETURNS TABLE(success boolean, message text, updated_request jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_balance integer;
BEGIN
  IF v_uid IS NULL THEN
    RETURN QUERY SELECT false, 'Unauthenticated', NULL::jsonb;
    RETURN;
  END IF;

  INSERT INTO public.provider_wallets (provider_id, balance, total_earned, total_commission_paid)
  VALUES (v_uid, 0, 0, 0)
  ON CONFLICT (provider_id) DO NOTHING;

  SELECT balance INTO v_balance
  FROM public.provider_wallets
  WHERE provider_id = v_uid;

  IF COALESCE(v_balance, 0) < 60 THEN
    RETURN QUERY SELECT
      false,
      format('Insufficient balance: top up to at least Rs. 60 before accepting service requests. Current balance: Rs. %s', COALESCE(v_balance, 0)),
      NULL::jsonb;
    RETURN;
  END IF;

  RETURN QUERY SELECT * FROM public.accept_service_request(v_uid, p_request_id);
END;
$function$;
