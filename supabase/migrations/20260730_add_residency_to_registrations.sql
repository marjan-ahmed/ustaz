-- Add residency column to both provider registration tables.
-- Stores the major neighborhood/area name (e.g. "Malir Halt").

ALTER TABLE public.provider_prelaunch_registrations
  ADD COLUMN IF NOT EXISTS residency text;

ALTER TABLE public.ustaz_registrations
  ADD COLUMN IF NOT EXISTS residency text;
