-- =============================================================
-- Migration: Wallet Escrow System (Manual Top-Up + Commission Ledger)
-- Fully idempotent — safe to run multiple times
-- =============================================================

-- ---------------------------------------------------------
-- 1. Create provider_wallets table
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS provider_wallets (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id           UUID NOT NULL UNIQUE REFERENCES ustaz_registrations("userId") ON DELETE CASCADE,
  balance               INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  total_earned          INTEGER NOT NULL DEFAULT 0,
  total_commission_paid INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------
-- 2. Create wallet_transactions table (immutable ledger)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id     UUID NOT NULL REFERENCES ustaz_registrations("userId") ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN ('commission', 'topup', 'admin_adjustment')),
  amount          INTEGER NOT NULL,  -- positive for credit, negative for debit
  balance_before  INTEGER NOT NULL,
  balance_after   INTEGER NOT NULL,
  request_id      UUID REFERENCES service_requests(id) ON DELETE SET NULL,
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------
-- 3. Create topup_requests table
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS topup_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id     UUID NOT NULL REFERENCES ustaz_registrations("userId") ON DELETE CASCADE,
  amount_sent     INTEGER NOT NULL CHECK (amount_sent > 0),
  transaction_id  TEXT NOT NULL,
  receipt_url     TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_id        UUID,
  admin_note      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------
-- 4. Enable RLS on new tables
-- ---------------------------------------------------------
ALTER TABLE provider_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE topup_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for provider_wallets
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'provider_wallets' AND policyname = 'Providers can view own wallet') THEN
    EXECUTE 'CREATE POLICY "Providers can view own wallet" ON provider_wallets FOR SELECT USING (auth.uid() = provider_id)';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'provider_wallets' AND policyname = 'Only RPCs can modify wallets') THEN
    EXECUTE 'CREATE POLICY "Only RPCs can modify wallets" ON provider_wallets FOR ALL USING (false)';
  END IF;
END $$;

-- RLS policies for wallet_transactions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wallet_transactions' AND policyname = 'Providers can view own transactions') THEN
    EXECUTE 'CREATE POLICY "Providers can view own transactions" ON wallet_transactions FOR SELECT USING (auth.uid() = provider_id)';
  END IF;
END $$;

-- RLS policies for topup_requests
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'topup_requests' AND policyname = 'Providers can view own topup requests') THEN
    EXECUTE 'CREATE POLICY "Providers can view own topup requests" ON topup_requests FOR SELECT USING (auth.uid() = provider_id)';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'topup_requests' AND policyname = 'Providers can insert own topup requests') THEN
    EXECUTE 'CREATE POLICY "Providers can insert own topup requests" ON topup_requests FOR INSERT WITH CHECK (auth.uid() = provider_id)';
  END IF;
END $$;

-- ---------------------------------------------------------
-- 5. RPC: get_wallet — returns wallet + recent transactions
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION get_wallet(p_provider_id UUID)
RETURNS TABLE(
  wallet_id              UUID,
  balance                INTEGER,
  total_earned           INTEGER,
  total_commission_paid  INTEGER,
  recent_transactions    JSONB,
  pending_topups         JSONB
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_wallet_id              UUID;
  v_balance                INTEGER;
  v_total_earned           INTEGER;
  v_total_commission_paid  INTEGER;
  v_transactions           JSONB;
  v_pending_topups         JSONB;
BEGIN
  -- Auto-create wallet if it doesn't exist
  INSERT INTO provider_wallets (provider_id, balance, total_earned, total_commission_paid)
  VALUES (p_provider_id, 0, 0, 0)
  ON CONFLICT (provider_id) DO NOTHING;

  SELECT id, balance, total_earned, total_commission_paid
  INTO v_wallet_id, v_balance, v_total_earned, v_total_commission_paid
  FROM provider_wallets WHERE provider_id = p_provider_id;

  -- Recent transactions (last 50)
  SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.created_at DESC), '[]'::jsonb)
  INTO v_transactions
  FROM (
    SELECT id, type, amount, balance_before, balance_after, request_id, description, created_at
    FROM wallet_transactions
    WHERE provider_id = p_provider_id
    ORDER BY created_at DESC
    LIMIT 50
  ) t;

  -- Pending topup requests
  SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.created_at DESC), '[]'::jsonb)
  INTO v_pending_topups
  FROM (
    SELECT id, amount_sent, transaction_id, receipt_url, status, admin_note, created_at, updated_at
    FROM topup_requests
    WHERE provider_id = p_provider_id
    ORDER BY created_at DESC
    LIMIT 20
  ) t;

  RETURN QUERY SELECT
    v_wallet_id,
    v_balance,
    v_total_earned,
    v_total_commission_paid,
    v_transactions,
    v_pending_topups;
END;
$$;

-- ---------------------------------------------------------
-- 6. RPC: create_topup_request
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION create_topup_request(
  p_provider_id    UUID,
  p_amount_sent    INTEGER,
  p_transaction_id TEXT,
  p_receipt_url    TEXT
)
RETURNS TABLE(success BOOLEAN, message TEXT, request_id UUID)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_request_id UUID;
BEGIN
  IF auth.uid() != p_provider_id THEN
    RETURN QUERY SELECT false, 'Not authenticated as this provider'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  INSERT INTO topup_requests (provider_id, amount_sent, transaction_id, receipt_url)
  VALUES (p_provider_id, p_amount_sent, p_transaction_id, p_receipt_url)
  RETURNING id INTO v_request_id;

  RETURN QUERY SELECT true, 'Top-up request submitted'::TEXT, v_request_id;
END;
$$;

-- ---------------------------------------------------------
-- 7. RPC: approve_topup_request (admin only — structure for now)
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
  v_provider_id   UUID;
  v_amount_sent   INTEGER;
  v_current_balance INTEGER;
BEGIN
  -- Get the topup request details
  SELECT provider_id, amount_sent INTO v_provider_id, v_amount_sent
  FROM topup_requests WHERE id = p_request_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Top-up request not found or already processed'::TEXT;
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
        admin_note = p_admin_note,
        updated_at = NOW()
    WHERE id = p_request_id;

    RETURN QUERY SELECT true, 'Top-up approved'::TEXT;
  ELSE
    -- Mark request as rejected
    UPDATE topup_requests
    SET status = 'rejected',
        admin_id = p_admin_id,
        admin_note = p_admin_note,
        updated_at = NOW()
    WHERE id = p_request_id;

    RETURN QUERY SELECT true, 'Top-up rejected'::TEXT;
  END IF;
END;
$$;

-- ---------------------------------------------------------
-- 8. Modify complete_service — deduct 10% commission
-- ---------------------------------------------------------
DROP FUNCTION IF EXISTS complete_service(UUID, UUID);

CREATE OR REPLACE FUNCTION complete_service(
  p_request_id UUID,
  p_provider_id UUID
)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  affected             INTEGER;
  current_status       TEXT;
  current_provider     UUID;
  v_balance_before     INTEGER := 0;
  v_commission         INTEGER := 0;
  v_balance_after      INTEGER := 0;
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

  -- Update request status
  UPDATE service_requests
  SET status = 'completed',
      service_completed_at = NOW(),
      updated_at = NOW()
  WHERE id = p_request_id
    AND accepted_by_provider_id = p_provider_id;

  GET DIAGNOSTICS affected = ROW_COUNT;

  -- Set provider back to available
  UPDATE ustaz_registrations
  SET provider_status = 'available'
  WHERE "userId" = p_provider_id;

  -- Clean up live_locations for this request
  DELETE FROM live_locations WHERE request_id = p_request_id;

  -- --- Wallet/Commission handling ---
  -- Ensure wallet exists
  INSERT INTO provider_wallets (provider_id, balance, total_earned, total_commission_paid)
  VALUES (p_provider_id, 0, 0, 0)
  ON CONFLICT (provider_id) DO NOTHING;

  -- Read current balance
  SELECT balance INTO v_balance_before
  FROM provider_wallets WHERE provider_id = p_provider_id;

  -- Commission is 60 PKR (10% of 600 PKR fare) — capped at current balance to prevent negative
  v_commission := LEAST(60, v_balance_before);
  v_balance_after := v_balance_before - v_commission;

  IF v_commission > 0 THEN
    -- Deduct commission
    UPDATE provider_wallets
    SET balance = balance - v_commission,
        total_commission_paid = total_commission_paid + v_commission,
        updated_at = NOW()
    WHERE provider_id = p_provider_id;

    -- Log transaction
    INSERT INTO wallet_transactions (provider_id, type, amount, balance_before, balance_after, request_id, description)
    VALUES (p_provider_id, 'commission', -v_commission, v_balance_before, v_balance_after,
            p_request_id, format('10%% commission on service (600 PKR fare, %s PKR deducted)', v_commission));
  END IF;

  RETURN QUERY SELECT affected > 0, CASE WHEN affected > 0 THEN 'Service completed' ELSE 'Update failed' END;
END;
$$;

-- ---------------------------------------------------------
-- 9. Modify update_provider_online_status — check balance floor
-- ---------------------------------------------------------
DROP FUNCTION IF EXISTS update_provider_online_status(UUID, BOOLEAN);

CREATE OR REPLACE FUNCTION update_provider_online_status(
  p_user_id UUID,
  p_online BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  -- If going online, check wallet balance >= 200 (hard floor)
  IF p_online THEN
    -- Ensure wallet exists
    INSERT INTO provider_wallets (provider_id, balance, total_earned, total_commission_paid)
    VALUES (p_user_id, 0, 0, 0)
    ON CONFLICT (provider_id) DO NOTHING;

    SELECT balance INTO v_balance
    FROM provider_wallets WHERE provider_id = p_user_id;

    IF v_balance < 200 THEN
      RAISE EXCEPTION 'Insufficient balance: need at least 200 PKR to go online (current: % PKR)', v_balance;
    END IF;
  END IF;

  UPDATE ustaz_registrations
  SET
    online_status = p_online,
    last_seen_at = NOW(),
    provider_status = CASE
      WHEN p_online THEN 'available'
      ELSE 'offline'
    END
  WHERE "userId" = p_user_id;
END;
$$;

-- ---------------------------------------------------------
-- 10. Create storage bucket for top-up receipts
-- ---------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('topup-receipts', 'topup-receipts', true, false, 5242880, ARRAY['image/png', 'image/jpeg', 'image/jpg'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: providers upload to own folder; anyone can view
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Providers can upload receipt images') THEN
    EXECUTE 'CREATE POLICY "Providers can upload receipt images"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = ''topup-receipts''
        AND auth.role() = ''authenticated''
        AND (storage.foldername(name))[1] = auth.uid()::text
      )';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Anyone can view receipt images') THEN
    EXECUTE 'CREATE POLICY "Anyone can view receipt images"
      ON storage.objects FOR SELECT
      USING (bucket_id = ''topup-receipts'')';
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_provider_id ON wallet_transactions(provider_id);
CREATE INDEX IF NOT EXISTS idx_topup_requests_provider_id ON topup_requests(provider_id);
CREATE INDEX IF NOT EXISTS idx_topup_requests_status ON topup_requests(status);
