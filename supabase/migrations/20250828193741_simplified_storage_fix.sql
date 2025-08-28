-- ============================================
-- SIMPLIFIED STORAGE CONFIGURATION
-- Date: 2025-08-28
-- Author: GitHub Copilot Supabase Architect
-- ============================================

-- ============================================
-- WORK WITH EXISTING "IMAGES" BUCKET
-- User already has "images" bucket with assets/ and team-logos/ folders
-- No need to create new policies - work with existing structure
-- ============================================

-- Just add utility functions to work with existing storage
CREATE OR REPLACE FUNCTION public.get_asset_url(asset_path text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  public_url text;
BEGIN
  -- Generate public URL for assets in images bucket
  SELECT
    concat(
      current_setting('app.settings.supabase_url', true),
      '/storage/v1/object/public/images/',
      asset_path
    ) INTO public_url;
  RETURN public_url;
END;
$$;

-- Function to check if user can access storage
CREATE OR REPLACE FUNCTION public.can_access_storage(bucket_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- For now, allow authenticated users to access images bucket
  -- This can be refined later based on specific requirements
  IF bucket_name = 'images' THEN
    RETURN auth.uid() IS NOT NULL;
  END IF;

  RETURN false;
END;
$$;

-- ============================================
-- COMMENTS AND NOTES
-- ============================================

COMMENT ON FUNCTION public.get_asset_url(text) IS 'Generate public URL for assets in existing images bucket';
COMMENT ON FUNCTION public.can_access_storage(text) IS 'Check if user has access to specific storage bucket';

-- Note: Storage policies are managed by Supabase automatically
-- The existing "images" bucket with assets/ and team-logos/ folders will continue to work
-- Additional storage security can be implemented at the application level
