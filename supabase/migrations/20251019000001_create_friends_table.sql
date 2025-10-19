-- Create Friends table for friend request management
-- This table tracks friendship relationships with status tracking

CREATE TABLE IF NOT EXISTS public."Friends" (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  requester_id uuid NOT NULL REFERENCES public."Profiles"(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES public."Profiles"(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT different_users CHECK (requester_id != addressee_id),
  CONSTRAINT unique_friendship UNIQUE (requester_id, addressee_id)
);

-- Create indexes for performance
CREATE INDEX friends_requester_idx ON public."Friends"(requester_id);
CREATE INDEX friends_addressee_idx ON public."Friends"(addressee_id);
CREATE INDEX friends_status_idx ON public."Friends"(status);

-- Add comments
COMMENT ON TABLE public."Friends" IS 'Tracks friendship relationships and requests';
COMMENT ON COLUMN public."Friends".status IS 'Status of friendship: pending, accepted, declined, blocked';

-- Enable Row Level Security
ALTER TABLE public."Friends" ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view friendships they're part of
CREATE POLICY "Users can view own friendships" ON public."Friends"
  FOR SELECT
  USING (
    auth.uid() = requester_id OR 
    auth.uid() = addressee_id
  );

-- Users can send friend requests
CREATE POLICY "Users can send friend requests" ON public."Friends"
  FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- Users can update friendships they're part of (accept/decline)
CREATE POLICY "Users can update own friendships" ON public."Friends"
  FOR UPDATE
  USING (
    auth.uid() = requester_id OR 
    auth.uid() = addressee_id
  );

-- Users can delete friendships they're part of
CREATE POLICY "Users can delete own friendships" ON public."Friends"
  FOR DELETE
  USING (
    auth.uid() = requester_id OR 
    auth.uid() = addressee_id
  );

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_friends_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER friends_updated_at_trigger
  BEFORE UPDATE ON public."Friends"
  FOR EACH ROW
  EXECUTE FUNCTION public.update_friends_updated_at();
