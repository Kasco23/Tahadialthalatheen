# New Features Documentation

This document describes the new features added to Tahadialthalatheen for enhanced social gameplay, statistics tracking, and leaderboards.

## Overview

The application now includes:

- **User Profiles with Usernames** - Unique usernames for player identification
- **Friends System** - Send and manage friend requests
- **In-App Notifications** - Real-time notifications for friend requests, matches, and more
- **Match Recording** - Automatic tracking of game results
- **Statistics & Leaderboards** - Player stats, segment performance, and global rankings
- **Home/Away Terminology** - Updated player roles from "Player 1/2" to "Home/Away"

---

## 1. User Profiles & Authentication

### Username System

During signup, users now create a **unique username** (minimum 3 characters) that is used throughout the application.

**Signup Flow:**

1. Navigate to `/signup`
2. Enter email, password, name, and **username**
3. Username uniqueness is validated before account creation
4. Username is displayed in profiles, leaderboards, and notifications

**Profile Fields:**

- `id` - UUID linked to auth.users
- `name` - Display name
- `username` - Unique identifier (min 3 chars)
- `email` - User email (from auth)
- `flag` - Country flag
- `team` - Favorite team
- `avatar_url` - Profile picture

### Profile Page

Access your profile at `/profile` to:

- View and edit profile information
- See your statistics (coming soon: tabbed view)
- Manage friends (coming soon)
- View match history

---

## 2. Friends System

### Features

- **Search for Users** - Find friends by username
- **Send Friend Requests** - Request friendship with other players
- **Accept/Decline Requests** - Manage incoming friend requests
- **Remove Friends** - Unfriend or cancel pending requests
- **Real-time Updates** - Friend status updates instantly via Supabase Realtime

### API Client Functions

Located in `src/lib/friends.ts`:

```typescript
// Send a friend request by username
await sendFriendRequest(username: string)

// Accept a friend request
await acceptFriendRequest(friendshipId: string)

// Decline a friend request
await declineFriendRequest(friendshipId: string)

// Remove a friend or cancel request
await removeFriend(friendshipId: string)

// Get all friends (accepted)
const friends = await getFriends()

// Get pending requests (received)
const pending = await getPendingRequests()

// Get sent requests
const sent = await getSentRequests()

// Search users by username
const results = await searchUsersByUsername(searchTerm: string)

// Subscribe to real-time updates
const unsubscribe = subscribeFriendsUpdates(userId, callback)
```

### Database Schema

**Friends Table:**

- `id` - UUID primary key
- `requester_id` - User who sent the request
- `addressee_id` - User who received the request
- `status` - 'pending', 'accepted', 'declined', or 'blocked'
- `created_at` - Request timestamp
- `updated_at` - Last status change

---

## 3. Notifications System

### Features

- **In-App Inbox** - View all notifications at `/inbox`
- **Notification Types:**
  - Friend requests
  - Friend request acceptances
  - Match invites (future)
  - Match results (future)
- **Mark as Read** - Track read/unread status
- **Real-time Delivery** - Instant notifications via Supabase Realtime
- **Automatic Triggers** - Notifications created automatically on friend actions

### Inbox Page (`/inbox`)

Features:

- Filter by all/unread notifications
- Click to mark as read and navigate
- Delete individual notifications
- Mark all as read
- Real-time updates

### API Client Functions

Located in `src/lib/notifications.ts`:

```typescript
// Get all notifications
const notifications = await getNotifications(unreadOnly?: boolean)

// Get unread count
const count = await getUnreadNotificationCount()

// Mark as read
await markNotificationAsRead(notificationId: string)

// Mark all as read
await markAllNotificationsAsRead()

// Delete notification
await deleteNotification(notificationId: string)

// Delete all read notifications
await deleteReadNotifications()

// Create notification (typically via serverless function)
await createNotification(recipientId, senderId, type, title, message, link, metadata)

// Subscribe to real-time updates
const unsubscribe = subscribeNotificationsUpdates(userId, callback)
```

### Database Schema

**Notifications Table:**

- `id` - UUID primary key
- `recipient_id` - User receiving notification
- `sender_id` - User who triggered notification (nullable)
- `type` - Notification type ('friend_request', 'friend_accepted', etc.)
- `title` - Notification title
- `message` - Notification message
- `link` - Optional navigation link
- `is_read` - Read status (boolean)
- `metadata` - Additional JSON data
- `created_at` - Creation timestamp
- `read_at` - Read timestamp (nullable)

**UserInbox View:**
Joins Notifications with sender profile information for easy display.

### Netlify Function

**Endpoint:** `/.netlify/functions/send-notification`

**Usage:**

```typescript
const response = await fetch("/.netlify/functions/send-notification", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    recipient_id: "user-uuid",
    sender_id: "sender-uuid", // optional
    type: "friend_request",
    title: "New Friend Request",
    message: "John sent you a friend request",
    link: "/inbox",
    metadata: { friend_id: "friendship-uuid" },
  }),
});
```

---

## 4. Match Recording & Statistics

### Features

- **Automatic Match Recording** - Games saved to database on completion
- **Segment Statistics** - Track performance per quiz segment
- **Player Stats** - Overall wins, losses, win rate, total points
- **Head-to-Head** - Compare stats against specific opponents
- **Nemesis Tracking** - Identify the player you lose to most
- **Recent Matches** - View match history

### API Client Functions

Located in `src/lib/matches.ts`:

```typescript
// Record a completed match
await recordMatch(
  sessionId,
  homePlayerId,
  awayPlayerId,
  homeTotalPoints,
  awayTotalPoints,
  winnerId,
  segmentsPlayed
)

// Update segment statistics
await updateSegmentStats(
  profileId,
  segmentCode,
  gamesPlayed,
  totalQuestions,
  correctAnswers,
  strikes,
  points,
  wins,
  losses
)

// Get player overall stats
const stats = await getPlayerStats(profileId?)

// Get segment-level stats
const segmentStats = await getPlayerSegmentStats(profileId?)

// Get head-to-head stats
const h2h = await getHeadToHeadStats(opponentId, currentUserId?)

// Find nemesis (most losses against)
const nemesis = await getNemesis(currentUserId?)

// Get recent matches
const matches = await getRecentMatches(profileId?, limit)
```

### Database Schema

**Matches Table:**

- `id` - UUID primary key
- `session_id` - Game session reference
- `home_player_id` - Home player (formerly Player 1)
- `away_player_id` - Away player (formerly Player 2)
- `winner_id` - Winner's profile ID (null for tie)
- `home_total_points` - Home player's total score
- `away_total_points` - Away player's total score
- `total_points` - Combined score (computed column)
- `segments_played` - Array of segment codes played
- `played_at` - Match timestamp

**PlayerSegmentStats Table:**

- `id` - UUID primary key
- `profile_id` - Player reference
- `segment_code` - Segment type (WDYK, AUCT, BELL, UPDW, REMO)
- `games_played` - Number of games with this segment
- `total_questions` - Questions answered
- `correct_answers` - Correct answer count
- `strikes` - Strike count (WDYK only)
- `points` - Total points earned in segment
- `wins` - Segment wins
- `losses` - Segment losses
- `updated_at` - Last update timestamp

---

## 5. Leaderboards

### Features

Two leaderboard tabs at `/leaderboard`:

1. **Top Players**
   - Ranked by win rate and total wins
   - Shows: rank, username, games played, wins, losses, win rate, total points
   - Displays flag and avatar
   - First 3 places get medals (🥇🥈🥉)

2. **Epic Matches**
   - Ranked by total combined points
   - Shows: both players, final scores, winner, segments played
   - Displays "Home" and "Away" player designations
   - Date played

### API Client Functions

Located in `src/lib/matches.ts`:

```typescript
// Get top players leaderboard
const players = await getLeaderboardPlayers(limit: number)

// Get top matches leaderboard
const matches = await getLeaderboardMatches(limit: number)
```

### Database Views

**leaderboard_players View:**

- Calculates win rate, total games, wins, losses, ties
- Ranks players by win rate, then wins, then total points
- Includes player profile information

**leaderboard_matches View:**

- Ranks matches by total_points (combined score)
- Includes both players' profile information
- Shows winner information

---

## 6. Home/Away Terminology

Throughout the application, player roles have been updated:

**Old Terminology:**

- Player 1 / Player A
- Player 2 / Player B

**New Terminology:**

- **Home** - First player position
- **Away** - Second player position

**Updated Locations:**

- Leaderboard displays
- Match records
- Database schema (home_player_id, away_player_id)
- UI labels

**Note:** Internal role values in database remain as 'Player1' and 'Player2' for backward compatibility. Display labels use ROLE_DISPLAY_LABELS mapping defined in `src/lib/types/index.ts`.

---

## 7. Real-time Features

All new features use **Supabase Realtime** for instant updates:

### Enabled Tables:

- Friends
- Notifications
- Matches
- PlayerSegmentStats

### Implementation:

```typescript
// Subscribe to friends updates
const unsubscribe = subscribeFriendsUpdates(userId, (payload) => {
  console.log("Friend update:", payload);
  // Reload friends list
});

// Subscribe to notifications
const unsubscribe = subscribeNotificationsUpdates(userId, (payload) => {
  console.log("New notification:", payload);
  // Update notification badge
});

// Cleanup
return () => unsubscribe();
```

---

## Database Migrations

### Migration Files (in `supabase/migrations/`):

1. `20251019000000_add_username_to_profiles.sql`
   - Adds username column to Profiles
   - Creates unique index (case-insensitive)
   - Adds RLS policies

2. `20251019000001_create_friends_table.sql`
   - Creates Friends table
   - Adds indexes and constraints
   - Creates RLS policies
   - Adds update trigger

3. `20251019000002_create_notifications_table.sql`
   - Creates Notifications table
   - Creates UserInbox view
   - Adds indexes and RLS policies

4. `20251019000003_create_matches_table.sql`
   - Creates Matches table
   - Adds computed column for total_points
   - Creates indexes and RLS policies

5. `20251019000004_create_player_segment_stats_table.sql`
   - Creates PlayerSegmentStats table
   - Creates upsert helper function
   - Adds indexes and RLS policies

6. `20251019000005_create_leaderboard_views.sql`
   - Creates leaderboard_players view
   - Creates leaderboard_matches view

7. `20251019000006_create_friend_notification_triggers.sql`
   - Creates automatic notification triggers
   - notify_friend_request() function
   - notify_friend_accepted() function

8. `20251019000007_enable_realtime.sql`
   - Enables Realtime on all new tables

### Running Migrations

```bash
# Apply migrations to local Supabase
npx supabase db reset

# Apply to production
npx supabase db push

# Generate new TypeScript types
npx supabase gen types typescript --local > src/lib/types/supabase.ts
```

---

## Environment Variables

### Required for Development:

```env
# Frontend (Vite)
VITE_SUPABASE_DATABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_DAILY_API_KEY=your_daily_api_key
VITE_DAILY_DOMAIN=your_daily_domain
```

### Required for Production (Netlify):

```env
# Add these in Netlify dashboard under Environment Variables
SUPABASE_DATABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DAILY_API_KEY=your_daily_api_key
```

---

## Testing

### Unit Tests (Coming Soon)

```bash
# Test friend request logic
pnpm test src/lib/friends.test.ts

# Test notification handling
pnpm test src/lib/notifications.test.ts

# Test match recording
pnpm test src/lib/matches.test.ts
```

### Manual Testing Checklist

- [ ] Sign up with username
- [ ] Username uniqueness validation works
- [ ] Search for users by username
- [ ] Send friend request
- [ ] Receive and accept friend request
- [ ] View notifications in inbox
- [ ] Mark notifications as read
- [ ] Real-time notification updates
- [ ] Play a complete match
- [ ] Match recorded in database
- [ ] View match in leaderboards
- [ ] Player stats calculated correctly
- [ ] Segment stats tracked

---

## Troubleshooting

### Username Already Exists

- Username must be unique across all users
- Try a different username during signup

### Notifications Not Appearing

- Check Supabase Realtime is enabled on Notifications table
- Verify RLS policies allow user to read their notifications
- Check browser console for subscription errors

### Match Not Recording

- Ensure both players have profile_id set
- Verify Matches table has correct RLS policies
- Check that winnerId is either homePlayerId, awayPlayerId, or null

### Leaderboard Empty

- Play at least one complete match
- Check that match was recorded in Matches table
- Verify leaderboard views have correct permissions

---

## Future Enhancements

- [ ] Profile page with tabbed view (Profile, Statistics, Friends)
- [ ] Charts for segment performance visualization
- [ ] Friend search with autocomplete
- [ ] Match invites system
- [ ] Post-match notifications
- [ ] Achievement system
- [ ] Team/clan features
- [ ] Tournament bracket system

---

## API Reference

### Friends API (`src/lib/friends.ts`)

All functions return Promises and throw errors that should be caught and handled.

### Notifications API (`src/lib/notifications.ts`)

All functions require authenticated user. Use try-catch for error handling.

### Matches API (`src/lib/matches.ts`)

Most functions accept optional profileId parameter. If omitted, uses current authenticated user.

---

## Support

For issues or questions about these features:

1. Check this documentation
2. Review database schema in `supabase/migrations/`
3. Check TypeScript types in `src/lib/types/`
4. Review API client source code in `src/lib/`

---

**Last Updated:** October 19, 2025
**Version:** 2.0.0 - Social & Statistics Update
