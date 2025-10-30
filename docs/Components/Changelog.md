# Components - Changelog

**Category**: Reusable UI components  
**Tracking Start**: October 17, 2025

---

## January 15, 2025

### QuestionManager.tsx - Created

**Type**: New Component  
**Impact**: High - Enables host to manage quiz content before game starts

#### Purpose

- Full CRUD interface for quiz questions
- Allows hosts to add, view, and delete questions from GameSetup page
- Segment-based filtering and validation

#### Features

1. **Question Listing**:
   - Display all questions from Questions table
   - Filter by segment (WDYK, AUCT, BELL, UPDW, REMO, or ALL)
   - Shows correct answer highlighting (green background)
   - Difficulty badges (easy/medium/hard)

2. **Add Question Form**:
   - Segment selection dropdown
   - Question text textarea
   - 4 answer input fields
   - Correct answer radio buttons (disabled for open-ended segments)
   - Difficulty selection
   - Validation: minimum 2 answers, required question text

3. **Delete Questions**:
   - One-click delete with confirmation dialog
   - Instant UI update after deletion

4. **Smart Validation**:
   - WDYK and AUCT segments automatically set `correct_answer_index` to NULL (open-ended)
   - Other segments require selecting correct answer via radio buttons
   - Empty answers are filtered out before submission

#### Technical Details

- **Dependencies**: Supabase Questions table, Framer Motion, React hooks
- **Database Operations**: Direct Supabase client queries (read/insert/delete)
- **Size**: ~18KB
- **RLS**: Respects row-level security policies on Questions table
- **UI Library**: TailwindCSS, Framer Motion animations

#### Integration

- Imported in `GameSetup.tsx`
- Opened via "📝 Manage Questions" button above "Start Quiz" button
- Modal overlay with full-screen responsive design

#### User Flow

1. Host creates session → navigates to GameSetup
2. Clicks "Manage Questions" button
3. Modal opens showing existing questions
4. Can filter by segment, add new questions, or delete existing ones
5. Close modal to return to GameSetup

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
