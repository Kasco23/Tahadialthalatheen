-- Enable Realtime on all new tables
-- This allows the UI to receive instant updates via Supabase subscriptions

-- Enable Realtime for Friends table
ALTER PUBLICATION supabase_realtime ADD TABLE public."Friends";

-- Enable Realtime for Matches table
ALTER PUBLICATION supabase_realtime ADD TABLE public."Matches";

-- Enable Realtime for PlayerSegmentStats table
ALTER PUBLICATION supabase_realtime ADD TABLE public."PlayerSegmentStats";

-- Enable Realtime for Notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public."Notifications";

-- Note: UserInbox is a view, not a table, so it cannot be added to realtime publication
-- Clients should subscribe to Notifications table instead

-- Add comments
COMMENT ON PUBLICATION supabase_realtime IS 'Realtime publication for instant UI updates';
