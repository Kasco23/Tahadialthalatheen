-- Create Notifications table for in-app notifications
-- This table tracks all notification events (friend requests, matches, etc.)

CREATE TABLE IF NOT EXISTS public."Notifications" (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  recipient_id uuid NOT NULL REFERENCES public."Profiles"(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES public."Profiles"(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('friend_request', 'friend_accepted', 'match_invite', 'match_result')),
  title text NOT NULL,
  message text NOT NULL,
  link text,
  is_read boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

-- Create indexes for performance
CREATE INDEX notifications_recipient_idx ON public."Notifications"(recipient_id);
CREATE INDEX notifications_is_read_idx ON public."Notifications"(is_read);
CREATE INDEX notifications_created_at_idx ON public."Notifications"(created_at DESC);
CREATE INDEX notifications_type_idx ON public."Notifications"(type);

-- Add comments
COMMENT ON TABLE public."Notifications" IS 'In-app notification system for friend requests, matches, and other events';
COMMENT ON COLUMN public."Notifications".type IS 'Type of notification: friend_request, friend_accepted, match_invite, match_result';
COMMENT ON COLUMN public."Notifications".metadata IS 'Additional data specific to notification type (JSON)';

-- Enable Row Level Security
ALTER TABLE public."Notifications" ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications" ON public."Notifications"
  FOR SELECT
  USING (auth.uid() = recipient_id);

-- Service role can insert notifications (via Netlify function)
CREATE POLICY "Service role can insert notifications" ON public."Notifications"
  FOR INSERT
  WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON public."Notifications"
  FOR UPDATE
  USING (auth.uid() = recipient_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" ON public."Notifications"
  FOR DELETE
  USING (auth.uid() = recipient_id);

-- Create view for user inbox with sender info
CREATE OR REPLACE VIEW public."UserInbox" AS
SELECT 
  n.id,
  n.recipient_id,
  n.sender_id,
  n.type,
  n.title,
  n.message,
  n.link,
  n.is_read,
  n.metadata,
  n.created_at,
  n.read_at,
  sender.username as sender_username,
  sender.name as sender_name,
  sender.avatar_url as sender_avatar
FROM public."Notifications" n
LEFT JOIN public."Profiles" sender ON n.sender_id = sender.id
ORDER BY n.created_at DESC;

-- Grant access to view
GRANT SELECT ON public."UserInbox" TO authenticated;

-- Add comment to view
COMMENT ON VIEW public."UserInbox" IS 'User inbox view with sender profile information';
