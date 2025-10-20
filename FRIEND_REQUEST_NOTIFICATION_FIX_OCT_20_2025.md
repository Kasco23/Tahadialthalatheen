# Friend Request Notification Fix

**Date**: October 20, 2025  
**Status**: ✅ Complete

## Issue

When attempting to send a friend request, users encountered the following error:
```
Failed to send friend request: column "user_id" of relation "Notifications" does not exist
```

## Root Cause

The database trigger function `notify_friend_activity()` was using incorrect column names:
- Using `user_id` instead of `recipient_id` 
- Using `NEW.addressee` instead of `NEW.addressee_id`
- Using `NEW.requester` instead of `NEW.requester_id`
- Missing required `title` column in INSERT statements

## Solution

Applied a database migration to fix the trigger function to use the correct column names that match the `Notifications` table schema.

### Migration Details

**Migration Name**: `fix_friend_notification_trigger`

### Changes Made

#### Before (Incorrect Code):
```sql
CREATE OR REPLACE FUNCTION public.notify_friend_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    INSERT INTO public."Notifications" (user_id, sender_id, type, message)
    VALUES (NEW.addressee, NEW.requester, 'friend_request', 'You have a new friend request!');
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'accepted' THEN
    INSERT INTO public."Notifications" (user_id, sender_id, type, message)
    VALUES (NEW.requester, NEW.addressee, 'friend_accept', 'Your friend request was accepted!');
  END IF;
  RETURN NEW;
END;
$function$
```

**Issues**:
- ❌ `user_id` column doesn't exist (should be `recipient_id`)
- ❌ `NEW.addressee` should be `NEW.addressee_id`
- ❌ `NEW.requester` should be `NEW.requester_id`
- ❌ Missing `title` column (required field)

#### After (Fixed Code):
```sql
CREATE OR REPLACE FUNCTION public.notify_friend_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    -- Send notification to the addressee (recipient of friend request)
    INSERT INTO public."Notifications" (recipient_id, sender_id, type, title, message)
    VALUES (
      NEW.addressee_id, 
      NEW.requester_id, 
      'friend_request', 
      'New Friend Request',
      'You have a new friend request!'
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Send notification to the requester (original sender) when accepted
    INSERT INTO public."Notifications" (recipient_id, sender_id, type, title, message)
    VALUES (
      NEW.requester_id, 
      NEW.addressee_id, 
      'friend_accept', 
      'Friend Request Accepted',
      'Your friend request was accepted!'
    );
  END IF;
  RETURN NEW;
END;
$function$
```

**Fixes**:
- ✅ Uses `recipient_id` (correct column name)
- ✅ Uses `NEW.addressee_id` (correct foreign key reference)
- ✅ Uses `NEW.requester_id` (correct foreign key reference)
- ✅ Includes `title` column with descriptive titles
- ✅ Added `OLD.status = 'pending'` check to prevent duplicate notifications

## Database Schema Reference

### Notifications Table Structure
```sql
Notifications:
- id (bigint, primary key)
- recipient_id (uuid) ← User receiving the notification
- sender_id (uuid) ← User who triggered the notification
- type (text) ← 'friend_request', 'friend_accept', 'match_invite', 'message'
- title (text, required) ← Notification title
- message (text) ← Notification body
- is_read (boolean, default: false)
- link (text, nullable)
- metadata (jsonb)
- created_at (timestamptz)
- read_at (timestamptz)
```

### UserInbox View
The `UserInbox` view is used by the frontend to display notifications with sender information:
```sql
UserInbox (View):
- id
- recipient_id
- type
- message
- is_read
- sender_name ← Joined from Profiles table
- created_at
```

## Testing

### Manual Test Steps
1. ✅ Login as User A
2. ✅ Send friend request to User B via username
3. ✅ Verify notification is created in database
4. ✅ Login as User B
5. ✅ Verify notification appears in UserInbox
6. ✅ Accept friend request
7. ✅ Verify acceptance notification sent to User A
8. ✅ Login as User A
9. ✅ Verify acceptance notification received

### Expected Behavior
- **Friend Request Sent**: Addressee receives notification with title "New Friend Request"
- **Friend Request Accepted**: Requester receives notification with title "Friend Request Accepted"
- **No Errors**: No database constraint violations
- **Proper Attribution**: Notifications show correct sender information

## Code Files Verified

### No Frontend Changes Required
The frontend code in `/src/lib/friends.ts` and `/src/lib/notifications.ts` was already correctly using:
- `Notifications` table (not a non-existent table)
- `recipient_id` column (via the `UserInbox` view)
- Proper TypeScript types

The issue was purely in the database trigger function, which has now been fixed.

## Validation

### Database Migration
✅ Migration applied successfully
✅ Function definition updated correctly
✅ No breaking changes to existing notifications

### TypeScript Types
✅ Types regenerated from database
✅ No type changes needed (already correct)

### Security Analysis
✅ Trivy scan completed
⚠️ Pre-existing vulnerabilities found (unrelated to this fix)
✅ No new security issues introduced

## Related Components

### Affected Tables
- `Friends` (has trigger that calls this function)
- `Notifications` (receives INSERT from trigger)

### Affected Views
- `UserInbox` (frontend uses this to display notifications)

### Affected Functions
- `notify_friend_activity()` (fixed)

### Affected Triggers
- `friends_notify_trigger` (calls the fixed function)

## Deployment Notes

- ✅ Migration runs automatically via Supabase
- ✅ No frontend code changes required
- ✅ No breaking changes
- ✅ Backward compatible (existing notifications unaffected)

## Verification Commands

```sql
-- Verify function is updated
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'notify_friend_activity';

-- Test friend request creation
-- (should create notification without errors)
INSERT INTO "Friends" (requester_id, addressee_id, status)
VALUES ('user-a-uuid', 'user-b-uuid', 'pending');

-- Verify notification was created
SELECT * FROM "Notifications" 
WHERE recipient_id = 'user-b-uuid' 
ORDER BY created_at DESC 
LIMIT 1;
```

## Success Criteria

✅ Friend requests can be sent without errors  
✅ Notifications are created with correct column names  
✅ Notifications include required `title` field  
✅ UserInbox view displays notifications correctly  
✅ Friend acceptance triggers notification to requester  
✅ No duplicate notifications on status updates
