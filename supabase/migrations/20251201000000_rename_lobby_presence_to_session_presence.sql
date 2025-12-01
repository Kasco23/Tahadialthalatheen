-- Migration: Rename lobby_presence to session_presence
-- This provides clearer semantics: session_presence indicates if a participant is actively in the session

-- Rename the column
ALTER TABLE "Participants" 
RENAME COLUMN lobby_presence TO session_presence;

-- Update the column comment
COMMENT ON COLUMN "Participants".session_presence IS 'Session presence status: NotJoined, Joined, Disconnected';
