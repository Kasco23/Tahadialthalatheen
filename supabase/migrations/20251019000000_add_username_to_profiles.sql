-- Add username field to Profiles table
-- This migration adds a unique username field with constraints

-- Add username column
ALTER TABLE public."Profiles"
ADD COLUMN username text;

-- Add check constraint for minimum length (3 characters)
ALTER TABLE public."Profiles"
ADD CONSTRAINT username_min_length CHECK (char_length(username) >= 3);

-- Create unique index on username (case-insensitive)
CREATE UNIQUE INDEX profiles_username_unique_idx ON public."Profiles" (LOWER(username));

-- Add comment to column
COMMENT ON COLUMN public."Profiles".username IS 'Unique username (min 3 chars) for user identification';

-- Enable RLS policies for username
-- Users can read all usernames (for friend search)
CREATE POLICY "Users can read all usernames" ON public."Profiles"
  FOR SELECT
  USING (true);

-- Users can only update their own username
CREATE POLICY "Users can update own username" ON public."Profiles"
  FOR UPDATE
  USING (auth.uid() = id);
