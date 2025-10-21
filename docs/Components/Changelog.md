# Components - Changelog

**Category**: Reusable UI components  
**Tracking Start**: October 17, 2025

---

## October 21, 2025

### Video Conference Token Management Fix

**Type**: Bug Fix  
**Impact**: Critical - Video call not working after Daily room creation  
**Files Modified**: `Lobby.tsx`, `VideoCall.tsx`

#### Problem

- Video calls were not appearing in Lobby despite Daily room being created
- Root cause: Duplicate token creation and database schema mismatches
- VideoCall component was creating its own tokens instead of using pre-created ones from Lobby
- Participants query was missing `username` field needed for token creation

#### Solution

- **Fixed Participants Query**: Added `username` field to Profiles JOIN in Lobby.tsx
- **Centralized Token Management**: VideoCall now uses tokens from Jotai atoms instead of creating duplicates  
- **Removed Duplicate Logic**: Eliminated redundant Daily room queries and token creation in VideoCall
- **Proper Name Handling**: Uses `username` (safe, no spaces) for tokens and `name` for display

#### Technical Changes

1. Updated Participants query to include `username` from Profiles table
2. Modified VideoCall to use `dailyRoomUrlAtom` and `dailyTokenAtom` instead of creating new tokens
3. Removed duplicate Supabase query logic from VideoCall component
4. Streamlined join process to use pre-created room and token data

#### Result

✅ Video conference now properly appears after Daily room creation  
✅ No duplicate token creation or API calls  
✅ Proper separation between display names and token usernames  
✅ Centralized token management via Jotai atoms

### Video Conference Name Display - Bug Fix

**Type**: Bug Fix  
**Impact**: Critical - Incorrect participant names shown in video conference  
**Files Modified**: `Lobby.tsx`, `ParticipantTile.tsx`

#### Problem

- Video conference showed wrong name ("ABood") instead of correct Profiles table name ("Tareq Salah")
- Root cause: `participantName` initialized from localStorage before Profiles data loaded
- Daily.co token created with old cached name

#### Solution

- Initialize `participantName` as empty string (not from localStorage)
- Token creation now waits for Profiles data to load
- ParticipantTile enhanced to always prefer Profiles name

#### Result

✅ Video conference now displays correct names from Profiles table  
✅ Single source of truth for participant names (Profiles table)

---

### Documentation Created

- ✅ Created comprehensive Components documentation structure
- ✅ Documented 30+ active components with specifications
- ✅ Established changelog tracking system

---

## October 17, 2025

### New Components

#### NotificationBell.tsx - Created

- **Purpose**: Display notification bell with unread count
- **Features**: Real-time updates, badge, navigation to inbox
- **Used In**: Homepage header
- **Impact**: Better notification discoverability

#### profile/FriendsTab.tsx - Created

- **Purpose**: Friends management interface
- **Features**: Send/accept friend requests, friend list
- **Used In**: Profile page Friends tab
- **Impact**: Social features enabled

#### profile/StatisticsTab.tsx - Created

- **Purpose**: User statistics display
- **Features**: Win/loss ratio, match history
- **Used In**: Profile page Statistics tab
- **Impact**: User engagement, competitive element

### Component Updates

#### StadiumBackground.tsx - Extended Usage

- **Change**: Now used across more pages (Inbox, Leaderboard, Profile)
- **Reason**: Consistent theming throughout app
- **Impact**: Better visual cohesion

---

## Pre-October 2025

### Initial Development

Core components created during initial app development:

- Video components (VideoRoom, VideoCall, ParticipantTile, ControlsBar)
- Session components (ActiveGames, LobbyStatus, Timer)
- Customization components (AvatarEditor, Flag selectors, Logo pickers)
- Background components (StadiumBackground, ChromaGrid, ChromaLogo)
- ReactBits integration components

---

## Upcoming Changes

### Planned

- Enhanced video controls with screen sharing improvements
- Accessibility improvements across all components

### Under Consideration

- Dark mode theme support
- Component library extraction for reusability

---

## See Also

- **CurrentState.md** - Component specifications
- **Deprecated.md** - Removed components
- **Overview.md** - Category introduction
