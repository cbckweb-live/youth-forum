-- Rate limits table for persistent (cross-serverless-instance) rate limiting.
-- Each row represents a tracking window for a (key, endpoint) pair.
--
-- The `key` column stores either "ip:<address>:<endpoint>" or "acct:<email>:<endpoint>"
-- so the same table handles both per-IP and per-account tracking.

CREATE TABLE IF NOT EXISTS public.rate_limits (
  id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  key       TEXT        NOT NULL,         -- e.g. "ip:1.2.3.4:auth:login"
  count     INTEGER    NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  blocked_until  TIMESTAMPTZ,              -- NULL = not blocked
  backoff_level  INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON public.rate_limits (key);

-- Unique constraint on key so upserts work cleanly
CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limits_key_unique ON public.rate_limits (key);

-- Clean up rows older than 24 hours
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.rate_limits
  WHERE updated_at < now() - INTERVAL '24 hours';
END;
$$;

-- Allow the service role and anon key to read/write
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage rate_limits"
  ON public.rate_limits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Anon access is not needed — rate limiting is server-side only
