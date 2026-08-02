-- Providers now submit only a payment screenshot; the transaction reference
-- field was removed from the top-up form on web and mobile. Existing rows keep
-- their reference. New rows may omit it.
ALTER TABLE public.topup_requests
  ALTER COLUMN transaction_id DROP NOT NULL;

-- Reordered so the optional reference is last and can carry a DEFAULT.
-- PostgREST calls with named arguments, so existing callers that still pass
-- p_transaction_id keep working.
DROP FUNCTION IF EXISTS public.create_topup_request(uuid, integer, text, text);

CREATE FUNCTION public.create_topup_request(
  p_provider_id uuid,
  p_amount_sent integer,
  p_receipt_url text,
  p_transaction_id text DEFAULT NULL
)
RETURNS TABLE(success boolean, message text, request_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_request_id UUID;
BEGIN
  IF auth.uid() != p_provider_id THEN
    RETURN QUERY SELECT false, 'Not authenticated as this provider'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  IF p_amount_sent IS NULL OR p_amount_sent <= 0 THEN
    RETURN QUERY SELECT false, 'Amount must be greater than zero'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  IF p_receipt_url IS NULL OR btrim(p_receipt_url) = '' THEN
    RETURN QUERY SELECT false, 'A payment screenshot is required'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  INSERT INTO topup_requests (provider_id, amount_sent, transaction_id, receipt_url)
  VALUES (
    p_provider_id,
    p_amount_sent,
    NULLIF(btrim(COALESCE(p_transaction_id, '')), ''),
    p_receipt_url
  )
  RETURNING id INTO v_request_id;

  RETURN QUERY SELECT true, 'Top-up request submitted'::TEXT, v_request_id;
END;
$function$;
