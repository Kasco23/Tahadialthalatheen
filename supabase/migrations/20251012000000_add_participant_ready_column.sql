-- Add isReady column to Participant table for lobby readiness system
-- This enables players to signal they're ready to start the quiz
-- Note: Using camelCase "isReady" to match existing Supabase naming convention

-- Add the isReady column with default value of false
ALTER TABLE "public"."Participant" 
ADD COLUMN IF NOT EXISTS "isReady" BOOLEAN DEFAULT false;

-- Add index for performance when querying ready status
CREATE INDEX IF NOT EXISTS "idx_participant_ready" 
ON "public"."Participant"("session_id", "isReady") 
WHERE "lobby_presence" = 'Joined';

-- Add comment to document the column
COMMENT ON COLUMN "public"."Participant"."isReady" IS 
'Indicates whether the player is ready to start the quiz. Only applicable to Player1 and Player2 roles in Lobby phase.';

-- Update existing rows to set isReady to false explicitly
UPDATE "public"."Participant" 
SET "isReady" = false 
WHERE "isReady" IS NULL;
