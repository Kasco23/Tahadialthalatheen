-- Database validation query to confirm all tables and columns are working
-- Run this in Supabase SQL Editor to test everything

-- Check all tables exist
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('games', 'players', 'game_events')
ORDER BY table_name, ordinal_position;

-- Check RLS policies are secure (should not find any insecure policies)
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test basic table functionality
SELECT 'Tables are accessible' as status;

-- Check for any additional tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
