-- ============================================================
-- Storage SELECT policies
-- Run this in the Supabase SQL editor.
--
-- Context:
--   Buckets have INSERT/UPDATE/DELETE for "authenticated" but
--   no SELECT policy, so files cannot be listed or downloaded.
--
-- Strategy:
--   - Public-facing pages (gallery, events, office-bearers,
--     blog, hero slider) are served to unauthenticated visitors,
--     so they need anon SELECT access.
--   - The admin dashboard is authenticated-only, but since the
--     same URLs are used on public pages we grant anon SELECT
--     on all buckets. This does NOT make the buckets "public"
--     via the dashboard toggle — access is still RLS-controlled.
-- ============================================================

-- gallery-media
CREATE POLICY "Public read gallery-media"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'gallery-media');

-- events-media
CREATE POLICY "Public read events-media"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'events-media');

-- office-bearers-media
CREATE POLICY "Public read office-bearers-media"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'office-bearers-media');

-- posts-media (cover images shown on public blog/news pages)
CREATE POLICY "Public read posts-media"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'posts-media');

-- posts-pdf (PDF links shown on public blog/news pages)
CREATE POLICY "Public read posts-pdf"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'posts-pdf');

-- media (hero slider images — hardcoded public URLs in HeroSlider.tsx)
CREATE POLICY "Public read media"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'media');
