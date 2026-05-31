-- =============================================================
-- Migration: Admin Portal — Enhanced topup management
-- Fully idempotent — safe to run multiple times
-- =============================================================

-- ---------------------------------------------------------
-- 1. RPC: get_pending_topup_requests — list pending + join provider info
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION get_pending_topup_requests()
RETURNS TABLE(
  id              UUID,
  provider_id     UUID,
  provider_name   TEXT,
  provider_phone  TEXT,
  amount_sent     INTEGER,
  transaction_id  TEXT,
  receipt_url     TEXT,
  status          TEXT,
  admin_note      TEXT,
  created_at      TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    tr.id,
    tr.provider_id,
    COALESCE(ur."firstName" || ' ' || ur."lastName", 'Unknown')::TEXT AS provider_name,
    COALESCE(ur."phoneCountryCode" || ur."phoneNumber", 'N/A')::TEXT AS provider_phone,
    tr.amount_sent,
    tr.transaction_id,
    tr.receipt_url,
    tr.status,
    tr.admin_note,
    tr.created_at,
    tr.updated_at
  FROM topup_requests tr
  LEFT JOIN ustaz_registrations ur ON ur."userId" = tr.provider_id
  ORDER BY tr.created_at DESC;
END;
$$;

-- ---------------------------------------------------------
-- 2. Enhanced approve_topup_request — now handles rejected with reason
--    and can optionally send push notification
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION approve_topup_request(
  p_request_id UUID,
  p_admin_id   UUID,
  p_approved   BOOLEAN,
  p_admin_note TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_provider_id      UUID;
  v_amount_sent      INTEGER;
  v_current_balance  INTEGER;
  v_transaction_id   TEXT;
  v_request_status   TEXT;
BEGIN
  -- Get the topup request details
  SELECT provider_id, amount_sent, transaction_id, status
  INTO v_provider_id, v_amount_sent, v_transaction_id, v_request_status
  FROM topup_requests WHERE id = p_request_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Top-up request not found'::TEXT;
    RETURN;
  END IF;

  IF v_request_status != 'pending' THEN
    RETURN QUERY SELECT false, format('Top-up request already %s', v_request_status)::TEXT;
    RETURN;
  END IF;

  IF p_approved THEN
    -- Ensure wallet exists
    INSERT INTO provider_wallets (provider_id, balance, total_earned, total_commission_paid)
    VALUES (v_provider_id, 0, 0, 0)
    ON CONFLICT (provider_id) DO NOTHING;

    -- Get current balance
    SELECT balance INTO v_current_balance
    FROM provider_wallets WHERE provider_id = v_provider_id;

    -- Credit wallet
    UPDATE provider_wallets
    SET balance = balance + v_amount_sent,
        total_earned = total_earned + v_amount_sent,
        updated_at = NOW()
    WHERE provider_id = v_provider_id;

    -- Log transaction
    INSERT INTO wallet_transactions (provider_id, type, amount, balance_before, balance_after, description)
    VALUES (v_provider_id, 'topup', v_amount_sent, v_current_balance, v_current_balance + v_amount_sent,
            'Manual top-up approved');

    -- Mark request as approved
    UPDATE topup_requests
    SET status = 'approved',
        admin_id = p_admin_id,
        admin_note = COALESCE(p_admin_note, 'Approved'),
        updated_at = NOW()
    WHERE id = p_request_id;

    RETURN QUERY SELECT true, format('Top-up of %s PKR approved for provider', v_amount_sent)::TEXT;
  ELSE
    -- Mark request as rejected with reason
    UPDATE topup_requests
    SET status = 'rejected',
        admin_id = p_admin_id,
        admin_note = COALESCE(p_admin_note, 'Rejected'),
        updated_at = NOW()
    WHERE id = p_request_id;

    RETURN QUERY SELECT true, format('Top-up rejected: %s', COALESCE(p_admin_note, 'No reason given'))::TEXT;
  END IF;
END;
$$;
