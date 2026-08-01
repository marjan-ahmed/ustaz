-- Provider display ID: USTP-0000001 format
-- Shared sequence for both prelaunch and registered providers

-- 1. Create the shared sequence
CREATE SEQUENCE IF NOT EXISTS provider_id_seq START 1;

-- 2. Add column to provider_prelaunch_registrations
ALTER TABLE provider_prelaunch_registrations
  ADD COLUMN IF NOT EXISTS provider_display_id text UNIQUE;

-- 3. Add column to ustaz_registrations
ALTER TABLE ustaz_registrations
  ADD COLUMN IF NOT EXISTS provider_display_id text UNIQUE;

-- 4. Trigger function: assign only if NULL (so carried-over IDs are preserved)
CREATE OR REPLACE FUNCTION assign_provider_display_id()
RETURNS trigger AS $$
BEGIN
  IF NEW.provider_display_id IS NULL THEN
    NEW.provider_display_id := 'USTP-' || lpad(nextval('provider_id_seq')::text, 7, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Attach triggers to both tables
DROP TRIGGER IF EXISTS trg_prelaunch_display_id ON provider_prelaunch_registrations;
CREATE TRIGGER trg_prelaunch_display_id
  BEFORE INSERT ON provider_prelaunch_registrations
  FOR EACH ROW EXECUTE FUNCTION assign_provider_display_id();

DROP TRIGGER IF EXISTS trg_ustaz_display_id ON ustaz_registrations;
CREATE TRIGGER trg_ustaz_display_id
  BEFORE INSERT ON ustaz_registrations
  FOR EACH ROW EXECUTE FUNCTION assign_provider_display_id();

-- 6. Backfill ONLY prelaunch rows (skip existing 43 registered providers)
UPDATE provider_prelaunch_registrations
SET provider_display_id = 'USTP-' || lpad(row_number() OVER (ORDER BY created_at)::text, 7, '0')
WHERE provider_display_id IS NULL;

-- 7. Advance sequence past prelaunch backfill so new signups continue from next number
SELECT setval('provider_id_seq', GREATEST(
  (SELECT COUNT(*) FROM provider_prelaunch_registrations),
  1
));
