-- Add is_ready column to Participant table for lobby readiness system
-- This enables players to signal they're ready to start the quiz

-- Add the is_ready column with default value of false
ALTER TABLE "public"."Participant" 
ADD COLUMN IF NOT EXISTS "is_ready" BOOLEAN DEFAULT false;

-- Add index for performance when querying ready status
CREATE INDEX IF NOT EXISTS "idx_participant_ready" 
ON "public"."Participant"("session_id", "is_ready") 
WHERE "lobby_presence" = 'Joined';

-- Add comment to document the column
COMMENT ON COLUMN "public"."Participant"."is_ready" IS 
'Indicates whether the player is ready to start the quiz. Only applicable to Player1 and Player2 roles in Lobby phase.';

-- Update existing rows to set is_ready to false explicitly
UPDATE "public"."Participant" 
SET "is_ready" = false 
WHERE "is_ready" IS NULL;
