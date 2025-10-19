-- Create trigger functions for automatic notification generation
-- These triggers automatically create notifications when friend activity occurs

-- Function to notify when a friend request is sent
CREATE OR REPLACE FUNCTION public.notify_friend_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify on new pending requests
  IF NEW.status = 'pending' THEN
    INSERT INTO public."Notifications" (
      recipient_id,
      sender_id,
      type,
      title,
      message,
      link,
      metadata
    )
    SELECT
      NEW.addressee_id,
      NEW.requester_id,
      'friend_request',
      'New Friend Request',
      (SELECT username FROM public."Profiles" WHERE id = NEW.requester_id) || ' sent you a friend request',
      '/inbox',
      jsonb_build_object('friend_id', NEW.id, 'requester_id', NEW.requester_id)
    WHERE EXISTS (SELECT 1 FROM public."Profiles" WHERE id = NEW.requester_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify when a friend request is accepted
CREATE OR REPLACE FUNCTION public.notify_friend_accepted()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify when status changes from pending to accepted
  IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    -- Notify the original requester that their request was accepted
    INSERT INTO public."Notifications" (
      recipient_id,
      sender_id,
      type,
      title,
      message,
      link,
      metadata
    )
    SELECT
      NEW.requester_id,
      NEW.addressee_id,
      'friend_accepted',
      'Friend Request Accepted',
      (SELECT username FROM public."Profiles" WHERE id = NEW.addressee_id) || ' accepted your friend request',
      '/profile',
      jsonb_build_object('friend_id', NEW.id, 'accepter_id', NEW.addressee_id)
    WHERE EXISTS (SELECT 1 FROM public."Profiles" WHERE id = NEW.addressee_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers on Friends table
CREATE TRIGGER friends_request_notification_trigger
  AFTER INSERT ON public."Friends"
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_friend_request();

CREATE TRIGGER friends_accepted_notification_trigger
  AFTER UPDATE ON public."Friends"
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.notify_friend_accepted();

-- Add comments
COMMENT ON FUNCTION public.notify_friend_request() IS 'Automatically creates notification when friend request is sent';
COMMENT ON FUNCTION public.notify_friend_accepted() IS 'Automatically creates notification when friend request is accepted';
