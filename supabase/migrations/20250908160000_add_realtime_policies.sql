-- Add realtime policies for broadcast and presence functionality
-- This enables the use of Supabase's native realtime features with proper security

-- Enable row-level security on realtime.messages if not already enabled
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

-- 1️⃣ Listening for broadcasts (public read) - already added
-- CREATE POLICY "Allow listening for broadcasts (public)"
--   ON realtime.messages
--   FOR SELECT
--   TO authenticated, anon
--   USING (true);

-- 2️⃣ Pushing broadcasts (public write) - already added 
-- CREATE POLICY "Allow pushing broadcasts (public)"
--   ON realtime.messages
--   FOR INSERT
--   TO authenticated, anon
--   WITH CHECK (true);

-- 3️⃣ Listening for presence (public read) - already added
-- CREATE POLICY "Allow listening for presence (public)"
--   ON realtime.messages
--   FOR SELECT
--   TO authenticated, anon
--   USING (extension = 'presence');

-- 4️⃣ Inserting presence rows (public write) - already added
-- CREATE POLICY "Allow inserting presence (public)"
--   ON realtime.messages
--   FOR INSERT
--   TO authenticated, anon
--   WITH CHECK (extension = 'presence');

-- 5️⃣ Updating presence rows (public write) - already added
-- CREATE POLICY "Allow updating presence (public)"
--   ON realtime.messages
--   FOR UPDATE
--   TO authenticated, anon
--   WITH CHECK (extension = 'presence');

-- Add additional policies for better security (optional - can be tightened later)

-- Allow deleting presence messages (for cleanup)
-- 1️⃣ Enable RLS on the table (if you haven’t already)
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- 2️⃣ Create the policy – no IF NOT EXISTS
CREATE POLICY "Allow deleting presence (public)"
  ON realtime.messages
  FOR DELETE
  TO authenticated, anon
  USING (extension = 'presence');

-- 3️⃣ Indexes for performance (these already support IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_realtime_messages_extension
  ON realtime.messages (extension);

CREATE INDEX IF NOT EXISTS idx_realtime_messages_topic
  ON realtime.messages (topic);

-- 4️⃣ Documentation comment
COMMENT ON TABLE realtime.messages IS
  'Realtime messages table with policies for broadcasts and presence. Policies allow public access for demo/dev purposes - tighten for production.';