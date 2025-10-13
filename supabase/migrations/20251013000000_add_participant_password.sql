-- Add password column to Participant table for rejoin authentication
-- This enables participants to rejoin sessions with password verification
-- and update their configuration (name, flag, logo)

-- Add the password column with nullable for backward compatibility
ALTER TABLE "public"."Participant" 
ADD COLUMN IF NOT EXISTS "password" TEXT DEFAULT NULL;

-- Add comment to document the column
COMMENT ON COLUMN "public"."Participant"."password" IS 
'Password hash for participant authentication when rejoining a session. Nullable for backward compatibility with existing participants.';

-- Note: Password hashing should be handled in application layer (bcrypt/argon2)
-- This migration only adds the column for storing the hash
