# Profile Display and Quick Join Updates

**Date**: 2025-01-17  
**Status**: ✅ Implemented - Ready for Testing

## Overview

This document summarizes the updates made to improve Profile display and Quick Join functionality based on user requirements.

---

## Changes Implemented

### 1. Profile.tsx - Read-Only Flag and Team Display

**Location**: `src/pages/Profile.tsx`

**Changes**:
- ✅ **Flag Display**: Now shows flag icon + full country name (e.g., "Palestine" instead of "PS")
  - Uses `getFlagName()` from `flagHelper.ts` to convert code to full name
  - Read-only display in a styled container
  - Editable only via "Change Flag" button
  
- ✅ **Team Display**: Now shows team logo + team name
  - Extracts team name from logo URL if stored as URL
  - Shows team logo image with proper fallback handling
  - Read-only display in a styled container
  - Editable only via "Change Team" button

- ✅ **Form Submission**: Removed team and flag from form submission
  - `formData` state now only contains `name`
  - `handleSubmit` only updates name field
  - Team and flag must be changed via dedicated buttons

**Code Example**:
```tsx
// Flag Display (Read-Only)
<div className="px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50">
  {profile?.flag ? (
    <div className="flex items-center gap-3">
      <Flag code={profile.flag} className="text-2xl" />
      <span className="text-sm font-medium text-gray-700">
        {getFlagName(profile.flag)}  {/* "Palestine" not "PS" */}
      </span>
    </div>
  ) : (
    <span className="text-sm text-gray-500">No country selected</span>
  )}
</div>
```

---

### 2. ActiveGames.tsx - Smart Quick Join with Host Detection

**Location**: `src/components/ActiveGames.tsx`

**Changes**:
- ✅ **Host Detection**: Checks `Sessions.host_profile_id` to determine if user is the session creator
  - Fetches session data to get `host_profile_id`
  - Compares with current user's ID
  
- ✅ **Host Quick Join Logic**:
  - If user is host: Check for existing Host participant
    - If exists: Update presence and navigate to `/lobby/{code}/host`
    - If not exists: Create Host participant and navigate to `/lobby/{code}/host`
  
- ✅ **Player Quick Join Logic**:
  - If user is not host: Use existing `joinAsPlayerWithCode` function
    - Automatically assigns Player1 or Player2 based on availability
    - Navigates to `/lobby/{code}/1` or `/lobby/{code}/2`

**Flow Diagram**:
```
Quick Join Click
      |
      v
Is user authenticated? --> No --> Navigate to /join (pre-filled)
      |
     Yes
      v
Fetch Sessions.host_profile_id
      |
      v
user.id === host_profile_id?
      |
      +---Yes (Host)------+         +---No (Player)---+
      v                              v
Check existing Host participant     Check available seats
      |                              |
      v                              v
Exists? --> Yes --> Update presence  Get Player1 or Player2
      |             Navigate /host   |
      v                              v
     No                              Navigate /1 or /2
      |
Create Host participant
Navigate /host
```

---

### 3. Lobby.tsx - Enhanced Profile Display

**Location**: `src/pages/Lobby.tsx`

**Status**: ✅ Already Implemented (from previous phase)

**Features**:
- Queries `Participants` with JOIN to `Profiles` table
- Query: `SELECT *, Profiles!profile_id(flag, team)`
- `ParticipantCard` component displays:
  - Flag icon using `Flag` component
  - Team logo using `LobbyLogo` component
  - Team logo URL generated via `getTeamLogoUrl()` from `teamLogoHelper.ts`

**Code Reference**:
```tsx
// ParticipantCard displays flag and team logo
<div className="flex items-center space-x-2">
  <Flag 
    code={(player.Profiles?.flag || player.flag) ?? "sa"} 
    className="text-lg" 
  />
  {teamLogoUrl && (
    <LobbyLogo 
      logoUrl={teamLogoUrl} 
      teamName={player.name} 
    />
  )}
  <div>
    <div className="text-sm font-bold text-white">{player.name}</div>
    <div className="text-xs text-blue-200">
      {getRoleDisplay(player)}
    </div>
  </div>
</div>
```

---

### 4. Helper Libraries

#### flagHelper.ts

**Location**: `src/lib/flagHelper.ts`  
**Status**: ✅ Created

**Features**:
- `FLAG_NAMES` record with 70+ country code mappings
  - Examples: `sa → Saudi Arabia`, `ps → Palestine`, `eg → Egypt`
- `getFlagName(code: string)`: Returns full country name
- `getCodeFromName(name: string)`: Reverse lookup
- `getAllCountries()`: Returns array of all countries

**Usage**:
```tsx
import { getFlagName } from "../lib/flagHelper";

getFlagName("ps")  // Returns: "Palestine"
getFlagName("sa")  // Returns: "Saudi Arabia"
```

#### teamLogoHelper.ts

**Location**: `src/lib/teamLogoHelper.ts`  
**Status**: ✅ Created (previous phase)

**Features**:
- Team-to-league mapping for 50+ teams
- `getTeamLogoUrl(teamName, league?)`: Generates Supabase Storage URL
- `getTeamsFromLeague(league)`: Lists teams in a league
- `getAllTeams()`: Returns all mapped teams

---

## Database Schema Reference

### Sessions Table
```sql
CREATE TABLE Sessions (
  session_id UUID PRIMARY KEY,
  session_code TEXT UNIQUE NOT NULL,
  host_profile_id UUID REFERENCES Profiles(id),  -- ← Host detection
  phase TEXT,
  game_state JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);
```

### Participants Table
```sql
CREATE TABLE Participants (
  participant_id UUID PRIMARY KEY,
  session_id UUID REFERENCES Sessions(session_id),
  profile_id UUID REFERENCES Profiles(id),  -- ← For JOIN
  name TEXT,
  flag TEXT,
  team_logo_url TEXT,
  role TEXT,  -- 'Host', 'Player1', 'Player2'
  lobby_presence TEXT,
  video_presence BOOLEAN,
  join_at TIMESTAMPTZ,
  disconnect_at TIMESTAMPTZ
);
```

### Profiles Table
```sql
CREATE TABLE Profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT,
  flag TEXT,  -- Country code (e.g., 'ps', 'sa')
  team TEXT,  -- Team name or logo URL
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Testing Checklist

### Profile Page Tests

- [ ] **Flag Display**
  - [ ] Navigate to `/profile`
  - [ ] Verify flag icon displays correctly
  - [ ] Verify full country name shows (not abbreviation)
  - [ ] Example: If flag is `ps`, should show "🇵🇸 Palestine"
  - [ ] Verify "Use 'Change Flag' button below to update" message shows

- [ ] **Team Display**
  - [ ] Navigate to `/profile`
  - [ ] Verify team logo displays if team is set
  - [ ] Verify team name displays correctly
  - [ ] Example: If team is Real Madrid, should show logo + "Real Madrid"
  - [ ] Verify "Use 'Change Team' button below to update" message shows

- [ ] **Form Submission**
  - [ ] Try to edit name field → Should work
  - [ ] Submit form → Should only update name
  - [ ] Verify flag and team remain unchanged
  - [ ] Success toast should appear

- [ ] **Change Flag/Team Buttons**
  - [ ] Click "Change Flag" → Should navigate to flag selection
  - [ ] Click "Change Team" → Should navigate to team selection
  - [ ] Complete selection → Return to profile
  - [ ] Verify new flag/team displays correctly

---

### Quick Join Tests

#### Test Case 1: Host Quick Join

**Setup**:
1. User A creates a session
2. User A's ID is stored in `Sessions.host_profile_id`
3. User A leaves the lobby

**Test Steps**:
- [ ] User A clicks "Quick Join" on their created session
- [ ] Expected: User A should be joined as Host
- [ ] Expected: Navigation to `/lobby/{code}/host`
- [ ] Expected: User A appears in participants list with role "Host"

**Verification**:
- [ ] Check `Participants` table → User A should have `role = 'Host'`
- [ ] Lobby should show User A with "Host" label
- [ ] User A should have host controls (start game, etc.)

---

#### Test Case 2: Player Quick Join (First Player)

**Setup**:
1. User A creates a session (host)
2. User B (not the host) clicks Quick Join

**Test Steps**:
- [ ] User B clicks "Quick Join" on User A's session
- [ ] Expected: User B should be joined as Player1
- [ ] Expected: Navigation to `/lobby/{code}/1`
- [ ] Expected: User B appears in participants list with role "Player1"

**Verification**:
- [ ] Check `Participants` table → User B should have `role = 'Player1'`
- [ ] Lobby should show User B with "Player1" label
- [ ] User B should see player-specific UI (ready button, etc.)

---

#### Test Case 3: Player Quick Join (Second Player)

**Setup**:
1. User A creates a session (host)
2. User B already joined as Player1
3. User C clicks Quick Join

**Test Steps**:
- [ ] User C clicks "Quick Join" on User A's session
- [ ] Expected: User C should be joined as Player2
- [ ] Expected: Navigation to `/lobby/{code}/2`
- [ ] Expected: User C appears in participants list with role "Player2"

**Verification**:
- [ ] Check `Participants` table → User C should have `role = 'Player2'`
- [ ] Lobby should show User C with "Player2" label
- [ ] All three participants should be visible in lobby

---

#### Test Case 4: Quick Join Session Full

**Setup**:
1. User A creates a session (host)
2. User B joined as Player1
3. User C joined as Player2
4. User D clicks Quick Join

**Test Steps**:
- [ ] User D clicks "Quick Join" on the full session
- [ ] Expected: Navigation to `/join?sessionCode={code}&error=full`
- [ ] Expected: Error message displays "Session is full"
- [ ] User D should not be added to `Participants` table

---

#### Test Case 5: Unauthenticated Quick Join

**Setup**:
1. User signs out
2. Active session exists

**Test Steps**:
- [ ] Unauthenticated user clicks "Quick Join"
- [ ] Expected: Navigation to `/join?sessionCode={code}&role=player`
- [ ] Join page should show pre-filled session code
- [ ] User can complete authentication flow

---

### Lobby Display Tests

- [ ] **Flag Icon Display**
  - [ ] Join lobby as any role
  - [ ] Verify each participant shows flag icon next to name
  - [ ] Verify flag icon matches country code from `Profiles.flag`
  - [ ] Example: User with flag `ps` shows 🇵🇸 icon

- [ ] **Team Logo Display**
  - [ ] Join lobby with team set in profile
  - [ ] Verify team logo displays next to participant name
  - [ ] Verify logo URL is correctly generated from `Profiles.team`
  - [ ] Verify fallback handling if logo fails to load

- [ ] **Real-time Updates**
  - [ ] Have User A join lobby
  - [ ] Have User B join lobby from different browser
  - [ ] Verify User B appears in User A's participant list
  - [ ] Verify flag and team logo show for User B
  - [ ] Verify presence indicators update in real-time

---

### Integration Tests

- [ ] **End-to-End Flow**
  1. User A creates session → `host_profile_id` set in `Sessions`
  2. User A sets flag to `ps` (Palestine) and team to Real Madrid
  3. User A leaves lobby
  4. User A clicks Quick Join → Should join as Host
  5. User A should see own flag (🇵🇸) and Real Madrid logo in lobby
  6. User B clicks Quick Join → Should join as Player1
  7. User B should see User A's flag and logo in participants list

- [ ] **Profile Change Propagation**
  1. User joins lobby with flag `sa` and team Barcelona
  2. User leaves lobby and goes to Profile
  3. User changes flag to `eg` (Egypt)
  4. User changes team to Real Madrid
  5. User rejoins lobby
  6. Verify new flag (🇪🇬) and Real Madrid logo display correctly

---

## Edge Cases to Consider

### Host Rejoining After Disconnect

**Scenario**: Host disconnects and Quick Joins again

**Expected Behavior**:
- Existing Host participant should be updated (not duplicated)
- `lobby_presence` updated to "Joined"
- `disconnect_at` set to `null`
- `join_at` updated to current timestamp

**Test**:
- [ ] Host creates session and joins
- [ ] Host closes browser tab (disconnect)
- [ ] Host reopens and clicks Quick Join
- [ ] Verify no duplicate Host participant
- [ ] Verify presence updated correctly

---

### Multiple Quick Joins Simultaneously

**Scenario**: Two players click Quick Join at the same time on the same session

**Expected Behavior**:
- One should get Player1, other should get Player2
- No race conditions causing duplicate roles

**Test**:
- [ ] Open two browsers with different users
- [ ] Both click Quick Join simultaneously
- [ ] Verify one gets Player1, other gets Player2
- [ ] Verify no database errors

---

### Profile Not Found

**Scenario**: User Quick Joins but profile doesn't exist

**Expected Behavior**:
- Navigate to `/join` page for manual entry
- Log error for debugging

**Test**:
- [ ] Manually delete user's profile from database
- [ ] User clicks Quick Join
- [ ] Verify graceful fallback to join page
- [ ] Check logs for error message

---

## Files Modified

1. ✅ `src/pages/Profile.tsx`
   - Updated flag and team displays to read-only
   - Removed flag/team from formData and form submission
   - Added `getFlagName` import and usage

2. ✅ `src/components/ActiveGames.tsx`
   - Updated `handleQuickJoin` with host detection logic
   - Added Sessions query to check `host_profile_id`
   - Implemented host vs player routing

3. ✅ `src/lib/flagHelper.ts` (Created)
   - New utility file with country code mappings
   - 70+ countries supported
   - Helper functions for code↔name conversion

4. ✅ `src/pages/Lobby.tsx` (Previously Updated)
   - Already has Profiles JOIN query
   - ParticipantCard displays flag icon and team logo

---

## Known Limitations

1. **Team Logo URL Extraction**: 
   - If team is stored as plain name (not URL), `getTeamLogoUrl()` generates URL
   - Only works for teams in `TEAM_LEAGUE_MAP` (50+ teams)
   - Other teams won't show logo (graceful fallback)

2. **Flag Name Mappings**:
   - Currently supports 70+ countries
   - New countries need to be added to `FLAG_NAMES` record
   - Unknown codes will display code as-is (e.g., "XX")

3. **Profile Data Freshness**:
   - Profile changes require rejoining lobby to reflect in participants list
   - Real-time profile updates not implemented (out of scope)

---

## Next Steps

1. **Testing**: Complete all tests in Testing Checklist above
2. **Bug Fixes**: Address any issues found during testing
3. **Documentation**: Update user-facing documentation if needed
4. **Monitoring**: Watch for errors in production logs
5. **Future Enhancements**:
   - Add more countries to `flagHelper.ts`
   - Add more teams to `teamLogoHelper.ts`
   - Consider real-time profile updates in lobby

---

## Success Criteria

✅ **Profile Display**:
- Flag shows icon + full country name (not abbreviation)
- Team shows logo + team name
- Both are read-only except via dedicated buttons

✅ **Quick Join**:
- Host detection works correctly via `Sessions.host_profile_id`
- Host joins as Host with correct routing
- Players join as Player1/Player2 with correct routing
- Handles all edge cases gracefully

✅ **Lobby**:
- All participants show flag icon next to name
- All participants show team logo next to name
- Data comes from `Profiles` table via JOIN

---

**Document End**
