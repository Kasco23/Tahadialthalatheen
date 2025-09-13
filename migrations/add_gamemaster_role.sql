-- Migration: Add GameMaster Role Support
-- Date: 2025-09-13
-- Description: Extends Participant role enum to include GameMaster role for PC/desktop coordinators

-- Drop existing role constraint
ALTER TABLE "public"."Participant" DROP CONSTRAINT IF EXISTS "Participant_role_check";

-- Add new constraint with GameMaster role
ALTER TABLE "public"."Participant" ADD CONSTRAINT "Participant_role_check" 
  CHECK (role = ANY (ARRAY['Host'::text, 'Player1'::text, 'Player2'::text, 'GameMaster'::text]));

-- Update role column comment with role explanations
COMMENT ON COLUMN "public"."Participant"."role" IS 'Participant role: Host (mobile coordinator), GameMaster (PC/desktop organizer), Player1/Player2 (quiz participants)';

-- Create index for faster role-based queries
CREATE INDEX IF NOT EXISTS "idx_participant_role" ON "public"."Participant"("role");
CREATE INDEX IF NOT EXISTS "idx_participant_session_role" ON "public"."Participant"("session_id", "role");