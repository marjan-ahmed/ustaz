-- CNIC scans (54 files) and top-up receipts were world-readable: both buckets
-- had public = true AND a permissive `SELECT ... USING (bucket_id = ...)` policy
-- for the public role, so anyone with a URL could download a provider's national
-- ID card without authenticating.
--
-- Profile photos lived in the same bucket, which is why it was public at all.
-- They were copied to the dedicated public `provider-avatars` bucket and
-- ustaz_registrations."avatarUrl" repointed first, so these two can now close.
--
-- Admin screens read these objects through /api/admin/signed-url, which mints a
-- short-lived signed URL with the service-role key after verifying the admin
-- session.

UPDATE storage.buckets SET public = false WHERE id IN ('provider-docs', 'topup-receipts');

-- ── provider-docs ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read access for provider docs" ON storage.objects;

CREATE POLICY "provider_docs_read_own"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'provider-docs'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

CREATE POLICY "provider_docs_service_role_read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'provider-docs'
    AND auth.role() = 'service_role'
  );

-- ── topup-receipts ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view receipt images" ON storage.objects;

CREATE POLICY "topup_receipts_read_own"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'topup-receipts'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

CREATE POLICY "topup_receipts_service_role_read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'topup-receipts'
    AND auth.role() = 'service_role'
  );
