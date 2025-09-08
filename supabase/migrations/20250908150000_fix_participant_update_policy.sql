-- Fix the Participant update policy to allow anonymous updates
-- This is needed because participants are anonymous in this quiz game application

DROP POLICY IF EXISTS "Participants can update themselves" ON "public"."Participant";

CREATE POLICY "Allow participant updates" ON "public"."Participant" 
FOR UPDATE USING (true);
