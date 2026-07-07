-- Mathetes table RLS
-- Public reads, admin-only writes.

ALTER TABLE public.mathetes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read mathetes" ON public.mathetes;
CREATE POLICY "Public read mathetes"
  ON public.mathetes
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin insert mathetes" ON public.mathetes;
CREATE POLICY "Admin insert mathetes"
  ON public.mathetes
  FOR INSERT
  TO authenticated
  WITH CHECK (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');

DROP POLICY IF EXISTS "Admin update mathetes" ON public.mathetes;
CREATE POLICY "Admin update mathetes"
  ON public.mathetes
  FOR UPDATE
  TO authenticated
  USING (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin')
  WITH CHECK (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');

DROP POLICY IF EXISTS "Admin delete mathetes" ON public.mathetes;
CREATE POLICY "Admin delete mathetes"
  ON public.mathetes
  FOR DELETE
  TO authenticated
  USING (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');