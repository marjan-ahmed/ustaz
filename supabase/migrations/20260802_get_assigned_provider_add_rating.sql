-- The mobile tracking card reads row.rating_avg / row.rating_count from this
-- RPC, but it never returned them, so the customer never saw a provider's
-- rating. Widening RETURNS TABLE requires a drop and recreate; both statements
-- run in one transaction so there is no window where the function is missing.
--
-- Existing callers select by name and ignore extra columns, so the web
-- tracking card is unaffected.

DROP FUNCTION IF EXISTS public.get_assigned_provider(uuid);

CREATE FUNCTION public.get_assigned_provider(p_request_id uuid)
RETURNS TABLE(
  user_id uuid,
  first_name text,
  last_name text,
  phone_country_code text,
  phone_number text,
  email text,
  avatar_url text,
  rating_avg numeric,
  rating_count integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  select u."userId"::uuid,
         u."firstName",
         u."lastName",
         u."phoneCountryCode",
         u."phoneNumber",
         u.email,
         u."avatarUrl",
         u.rating_avg,
         u.rating_count
    from public.service_requests sr
    join public.ustaz_registrations u
      on u."userId" = sr.accepted_by_provider_id
   where sr.id = p_request_id
     and sr.user_id = auth.uid()
     and sr.accepted_by_provider_id is not null;
$function$;

-- Recreate the grants the dropped function had. CREATE FUNCTION grants EXECUTE
-- to PUBLIC by default and the original ACL had no PUBLIC entry, so revoke it
-- back off to match exactly.
GRANT EXECUTE ON FUNCTION public.get_assigned_provider(uuid) TO anon, authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.get_assigned_provider(uuid) FROM PUBLIC;
