-- Helper functions for the admin dashboard overview
-- These are called via supabase.rpc() using the service_role key

-- Get total storage usage per bucket
CREATE OR REPLACE FUNCTION get_storage_usage()
RETURNS TABLE(bucket text, total_bytes bigint, total_mb float)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    bucket_id::text,
    COALESCE(SUM((metadata->>'size')::bigint), 0)::bigint,
    COALESCE(ROUND(SUM((metadata->>'size')::numeric) / 1048576.0, 2), 0.0)::float
  FROM storage.objects
  GROUP BY bucket_id
  ORDER BY total_bytes DESC;
$$;

-- Get total size of the current database
CREATE OR REPLACE FUNCTION get_database_size()
RETURNS TABLE(size_bytes bigint, size_pretty text)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT pg_database_size(current_database())::bigint, pg_size_pretty(pg_database_size(current_database()));
$$;
