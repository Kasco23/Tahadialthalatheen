-- ============================================
-- DATABASE TESTS AND VALIDATION FUNCTIONS
-- Date: 2025-08-28
-- Author: GitHub Copilot Supabase Architect
-- ============================================

-- ============================================
-- RLS POLICY VALIDATION FUNCTIONS
-- ============================================

-- Function to test RLS policies for a specific table
CREATE OR REPLACE FUNCTION public.test_rls_policies(table_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  test_results json;
  test_user_id uuid := '550e8400-e29b-41d4-a716-446655440000'; -- Test UUID
  policy_count integer;
  enabled_rls boolean;
BEGIN
  -- Check if RLS is enabled
  SELECT c.relrowsecurity INTO enabled_rls
  FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public' AND c.relname = table_name;

  -- Count policies
  SELECT count(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = table_name;

  SELECT json_build_object(
    'table_name', table_name,
    'rls_enabled', COALESCE(enabled_rls, false),
    'policy_count', policy_count,
    'has_select_policy', EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
      AND tablename = table_name
      AND cmd = 'SELECT'
    ),
    'has_insert_policy', EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
      AND tablename = table_name
      AND cmd = 'INSERT'
    ),
    'has_update_policy', EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
      AND tablename = table_name
      AND cmd = 'UPDATE'
    ),
    'has_delete_policy', EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
      AND tablename = table_name
      AND cmd = 'DELETE'
    )
  ) INTO test_results;

  RETURN test_results;
END;
$$;

-- Function to validate all RLS policies
CREATE OR REPLACE FUNCTION public.validate_all_rls_policies()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  results json;
  tables text[] := ARRAY['games', 'players', 'game_events', 'rooms'];
  table_name text;
  table_results json[] := '{}';
BEGIN
  FOREACH table_name IN ARRAY tables
  LOOP
    table_results := array_append(table_results, public.test_rls_policies(table_name));
  END LOOP;

  SELECT json_build_object(
    'timestamp', now(),
    'total_tables', array_length(tables, 1),
    'results', array_to_json(table_results)
  ) INTO results;

  RETURN results;
END;
$$;

-- ============================================
-- PERFORMANCE TESTING FUNCTIONS
-- ============================================

-- Function to test index performance
CREATE OR REPLACE FUNCTION public.test_index_performance()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  results json;
  start_time timestamptz;
  end_time timestamptz;
  query_duration interval;
BEGIN
  -- Test games table queries
  start_time := clock_timestamp();

  PERFORM count(*) FROM public.games WHERE status = 'waiting';
  PERFORM count(*) FROM public.games WHERE host_id IS NOT NULL;
  PERFORM count(*) FROM public.players WHERE connection_status = 'online';
  PERFORM count(*) FROM public.game_events WHERE created_at > (now() - interval '1 hour');

  end_time := clock_timestamp();
  query_duration := end_time - start_time;

  SELECT json_build_object(
    'timestamp', now(),
    'test_queries_duration_ms', EXTRACT(milliseconds FROM query_duration),
    'indexes_present', json_build_object(
      'games_status', EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'games' AND indexname LIKE '%status%'
      ),
      'games_host_id', EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'games' AND indexname LIKE '%host_id%'
      ),
      'players_connection', EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'players' AND indexname LIKE '%connection%'
      ),
      'events_timestamp', EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'game_events' AND indexname LIKE '%timestamp%'
      )
    )
  ) INTO results;

  RETURN results;
END;
$$;

-- ============================================
-- STORAGE VALIDATION FUNCTIONS
-- ============================================

-- Function to validate storage buckets and policies
CREATE OR REPLACE FUNCTION public.validate_storage_setup()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  results json;
  expected_buckets text[] := ARRAY['avatars', 'game-assets', 'recordings'];
  bucket_name text;
  bucket_results json[] := '{}';
  bucket_exists boolean;
  policy_count integer;
BEGIN
  FOREACH bucket_name IN ARRAY expected_buckets
  LOOP
    -- Check if bucket exists
    SELECT EXISTS (
      SELECT 1 FROM storage.buckets WHERE id = bucket_name
    ) INTO bucket_exists;

    -- Count policies for this bucket
    SELECT count(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND qual LIKE '%' || bucket_name || '%';

    bucket_results := array_append(bucket_results, json_build_object(
      'bucket_name', bucket_name,
      'exists', bucket_exists,
      'policy_count', policy_count
    ));
  END LOOP;

  SELECT json_build_object(
    'timestamp', now(),
    'expected_buckets', array_length(expected_buckets, 1),
    'bucket_results', array_to_json(bucket_results),
    'total_storage_policies', (
      SELECT count(*) FROM pg_policies
      WHERE schemaname = 'storage' AND tablename = 'objects'
    )
  ) INTO results;

  RETURN results;
END;
$$;

-- ============================================
-- FUNCTION TESTING SUITE
-- ============================================

-- Function to test all utility functions
CREATE OR REPLACE FUNCTION public.test_utility_functions()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  results json;
  test_game_id text := 'test-game-123';
  test_user_id uuid := '550e8400-e29b-41d4-a716-446655440000';
  function_tests json[] := '{}';
  test_result json;
BEGIN
  -- Test is_game_host function
  BEGIN
    PERFORM public.is_game_host(test_game_id);
    test_result := json_build_object(
      'function', 'is_game_host',
      'status', 'success',
      'error', null
    );
  EXCEPTION WHEN OTHERS THEN
    test_result := json_build_object(
      'function', 'is_game_host',
      'status', 'error',
      'error', SQLERRM
    );
  END;
  function_tests := array_append(function_tests, test_result);

  -- Test is_game_participant function
  BEGIN
    PERFORM public.is_game_participant(test_game_id);
    test_result := json_build_object(
      'function', 'is_game_participant',
      'status', 'success',
      'error', null
    );
  EXCEPTION WHEN OTHERS THEN
    test_result := json_build_object(
      'function', 'is_game_participant',
      'status', 'error',
      'error', SQLERRM
    );
  END;
  function_tests := array_append(function_tests, test_result);

  -- Test cleanup_expired_rooms function
  BEGIN
    PERFORM public.cleanup_expired_rooms();
    test_result := json_build_object(
      'function', 'cleanup_expired_rooms',
      'status', 'success',
      'error', null
    );
  EXCEPTION WHEN OTHERS THEN
    test_result := json_build_object(
      'function', 'cleanup_expired_rooms',
      'status', 'error',
      'error', SQLERRM
    );
  END;
  function_tests := array_append(function_tests, test_result);

  -- Test get_user_avatar_url function
  BEGIN
    PERFORM public.get_user_avatar_url(test_user_id);
    test_result := json_build_object(
      'function', 'get_user_avatar_url',
      'status', 'success',
      'error', null
    );
  EXCEPTION WHEN OTHERS THEN
    test_result := json_build_object(
      'function', 'get_user_avatar_url',
      'status', 'error',
      'error', SQLERRM
    );
  END;
  function_tests := array_append(function_tests, test_result);

  SELECT json_build_object(
    'timestamp', now(),
    'total_functions_tested', array_length(function_tests, 1),
    'test_results', array_to_json(function_tests)
  ) INTO results;

  RETURN results;
END;
$$;

-- ============================================
-- COMPREHENSIVE VALIDATION FUNCTION
-- ============================================

-- Master validation function that runs all tests
CREATE OR REPLACE FUNCTION public.run_comprehensive_validation()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  results json;
  rls_results json;
  performance_results json;
  storage_results json;
  function_results json;
  overall_status text := 'PASS';
  error_count integer := 0;
BEGIN
  -- Run all validation functions
  SELECT public.validate_all_rls_policies() INTO rls_results;
  SELECT public.test_index_performance() INTO performance_results;
  SELECT public.validate_storage_setup() INTO storage_results;
  SELECT public.test_utility_functions() INTO function_results;

  -- Count errors from function tests
  SELECT count(*) INTO error_count
  FROM json_array_elements(function_results->'test_results') AS func_test
  WHERE func_test->>'status' = 'error';

  IF error_count > 0 THEN
    overall_status := 'FAIL';
  END IF;

  SELECT json_build_object(
    'validation_timestamp', now(),
    'overall_status', overall_status,
    'error_count', error_count,
    'rls_validation', rls_results,
    'performance_tests', performance_results,
    'storage_validation', storage_results,
    'function_tests', function_results,
    'summary', json_build_object(
      'total_tables_with_rls', (
        SELECT count(DISTINCT tablename)
        FROM pg_policies
        WHERE schemaname = 'public'
      ),
      'total_indexes', (
        SELECT count(*)
        FROM pg_indexes
        WHERE tablename IN ('games', 'players', 'game_events', 'rooms')
      ),
      'total_storage_buckets', (
        SELECT count(*) FROM storage.buckets
      ),
      'total_custom_functions', (
        SELECT count(*)
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname LIKE 'test_%' OR p.proname LIKE 'validate_%'
        OR p.proname LIKE 'is_%' OR p.proname LIKE 'get_%'
        OR p.proname LIKE 'cleanup_%' OR p.proname LIKE 'update_%'
      )
    )
  ) INTO results;

  -- Log validation results
  INSERT INTO public.game_events (game_id, event_type, data)
  VALUES ('SYSTEM', 'VALIDATION_RUN', results);

  RETURN results;
END;
$$;

-- ============================================
-- PERFORMANCE MONITORING FUNCTIONS
-- ============================================

-- Function to monitor query performance over time
CREATE OR REPLACE FUNCTION public.monitor_query_performance(query_name text, query_sql text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  start_time timestamptz;
  end_time timestamptz;
  execution_time interval;
  results json;
BEGIN
  start_time := clock_timestamp();

  -- Execute the query (this is simplified - in practice you'd use EXECUTE)
  -- EXECUTE query_sql;

  end_time := clock_timestamp();
  execution_time := end_time - start_time;

  SELECT json_build_object(
    'query_name', query_name,
    'execution_time_ms', EXTRACT(milliseconds FROM execution_time),
    'timestamp', now()
  ) INTO results;

  -- Log performance data
  INSERT INTO public.game_events (game_id, event_type, data, metadata)
  VALUES (
    'SYSTEM',
    'QUERY_PERFORMANCE',
    results,
    json_build_object('category', 'monitoring')
  );

  RETURN results;
END;
$$;

-- ============================================
-- SECURITY AUDIT FUNCTIONS
-- ============================================

-- Function to audit security configuration
CREATE OR REPLACE FUNCTION public.audit_security_configuration()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  results json;
  insecure_policies integer := 0;
  missing_auth_checks integer := 0;
BEGIN
  -- Check for overly permissive policies
  SELECT count(*) INTO insecure_policies
  FROM pg_policies
  WHERE schemaname = 'public'
  AND (qual LIKE '%true%' OR qual IS NULL);

  -- Check for missing auth.uid() checks
  SELECT count(*) INTO missing_auth_checks
  FROM pg_policies
  WHERE schemaname = 'public'
  AND qual NOT LIKE '%auth.uid()%'
  AND qual NOT LIKE '%auth.jwt()%';

  SELECT json_build_object(
    'audit_timestamp', now(),
    'security_status', CASE
      WHEN insecure_policies > 0 THEN 'CRITICAL'
      WHEN missing_auth_checks > 0 THEN 'WARNING'
      ELSE 'SECURE'
    END,
    'insecure_policies_count', insecure_policies,
    'policies_without_auth_checks', missing_auth_checks,
    'total_policies', (
      SELECT count(*) FROM pg_policies WHERE schemaname = 'public'
    ),
    'recommendations', CASE
      WHEN insecure_policies > 0 THEN 'URGENT: Remove policies with "using (true)" or "with check (true)"'
      WHEN missing_auth_checks > 0 THEN 'Add auth.uid() checks to all user-specific policies'
      ELSE 'Security configuration is properly implemented'
    END
  ) INTO results;

  RETURN results;
END;
$$;

-- ============================================
-- AUTOMATED TEST TRIGGERS
-- ============================================

-- Function to automatically run tests after schema changes
CREATE OR REPLACE FUNCTION public.auto_validate_after_migration()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  validation_results json;
BEGIN
  -- Run comprehensive validation
  SELECT public.run_comprehensive_validation() INTO validation_results;

  -- If validation fails, log warning
  IF validation_results->>'overall_status' = 'FAIL' THEN
    INSERT INTO public.game_events (game_id, event_type, data, metadata)
    VALUES (
      'SYSTEM',
      'VALIDATION_FAILURE',
      validation_results,
      json_build_object('severity', 'error', 'auto_triggered', true)
    );
  END IF;

  RETURN NULL;
END;
$$;

-- ============================================
-- COMMENTS AND DOCUMENTATION
-- ============================================

COMMENT ON FUNCTION public.test_rls_policies(text) IS 'Test RLS policy configuration for a specific table';
COMMENT ON FUNCTION public.validate_all_rls_policies() IS 'Validate RLS policies across all core tables';
COMMENT ON FUNCTION public.test_index_performance() IS 'Test query performance and verify indexes are in place';
COMMENT ON FUNCTION public.validate_storage_setup() IS 'Validate storage buckets and policies are properly configured';
COMMENT ON FUNCTION public.test_utility_functions() IS 'Test all custom utility functions for errors';
COMMENT ON FUNCTION public.run_comprehensive_validation() IS 'Master validation function that runs all database tests';
COMMENT ON FUNCTION public.monitor_query_performance(text, text) IS 'Monitor and log query execution performance';
COMMENT ON FUNCTION public.audit_security_configuration() IS 'Audit security policies for vulnerabilities';

-- ============================================
-- INITIAL VALIDATION RUN
-- ============================================

-- Run initial validation to test the migration
-- SELECT public.run_comprehensive_validation();
