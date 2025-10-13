-- Add lastHeartbeat column to Participant table for presence tracking
-- This enables accurate online/offline detection based on activity timestamps

-- Add the lastHeartbeat column with default to current timestamp
ALTER TABLE "public"."Participant" 
ADD COLUMN IF NOT EXISTS "lastHeartbeat" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add index for performance when querying stale participants
CREATE INDEX IF NOT EXISTS "idx_participant_heartbeat" 
ON "public"."Participant"("lastHeartbeat") 
WHERE "lobby_presence" = 'Joined';

-- Add comment to document the column
COMMENT ON COLUMN "public"."Participant"."lastHeartbeat" IS 
'Timestamp of the last heartbeat from this participant. Updated every 30 seconds by active clients. Used to detect stale/disconnected participants.';

-- Update existing rows to set lastHeartbeat to current time
UPDATE "public"."Participant" 
SET "lastHeartbeat" = NOW() 
WHERE "lastHeartbeat" IS NULL AND "lobby_presence" = 'Joined';
