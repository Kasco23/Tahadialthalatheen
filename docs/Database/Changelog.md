# Database - Changelog

**Last Updated**: October 21, 2025

---

## October 21, 2025 - Project Cleanup & Documentation Consolidation

### Removed Duplicate/Obsolete Database Documentation

**Type**: Cleanup  
**Impact**: None - Removed redundant documentation  
**Files Removed**: 1 file

#### Changes Made

1. **Deleted `supabase/schema_dump.md`**
   - **Reason**: Fully superseded by `docs/Database/CurrentState.md`
   - **Details**: 
     - Old schema_dump.md was ~15KB, outdated format, less detailed
     - CurrentState.md is 700+ lines, comprehensive, actively maintained
     - All information from schema_dump.md is now in CurrentState.md with better organization
   - **Impact**: Zero - All schema information preserved in better format

2. **Consolidated Test Files**
   - Removed `tests/components/FlagSelector.test.tsx` (duplicate)
   - Tests now colocated in `src/components/` for better maintainability

3. **Cleaned Up Temporary Documentation**
   - Removed 6 temporary/meta documentation files
   - Removed external Daily.co example code (21 files)
   - Updated `.gitignore` to prevent build cache commits

**Total Cleanup**: 24 files removed (~763KB), no functionality lost

---

## October 21, 2025 - Database Usage Modernization

### Code Updates to Match Current Schema

**Type**: Refactoring  
**Impact**: Critical - Fixes broken realtime subscriptions and queries  
**Files Modified**: 5 core files

#### Changes Made

1. **Fixed Realtime Subscription Table Names**
   - Updated 4 instances of `table: "Participant"` → `table: "Participants"`
   - Updated 1 instance of `table: "DailyRoom"` → `table: "DailyRooms"`
   - **Affected Files**:
     - `src/lib/realtimeHooks.ts`
     - `src/pages/Lobby.tsx`
     - `src/pages/Results.tsx`
     - `src/components/LobbyStatus.tsx`
   - **Reason**: Table was renamed to plural form in October 2025 migration
   - **Impact**: Real-time updates now work correctly

2. **Updated Queries to Use Profile JOIN**
   - Modified 3 components to fetch user data from `Profiles` table via JOIN
   - **Components Updated**:
     - `LobbyStatus.tsx` - Participant list display
     - `RejoinModal.tsx` - Participant selection
     - `Results.tsx` - Player names, flags, team logos
   - **Change Pattern**:
     ```typescript
     // OLD - Direct column access (broken)
     SELECT participant_id, name, flag, team_logo_url FROM Participants
     
     // NEW - Profile JOIN
     SELECT 
       participant_id,
       role,
       Profiles!profile_id (name, flag, team)
     FROM Participants
     ```
   - **Reason**: `name`, `flag`, `team_logo_url` columns removed from Participants table (Oct 20, 2025)
   - **Impact**: User profile data now displays correctly

3. **Added Data Normalization**
   - Implemented normalization logic to handle Supabase JOIN behavior
   - Handles both array and object responses from Profile JOIN
   - **Code Pattern**:
     ```typescript
     const profileData = Array.isArray(p.Profiles) 
       ? p.Profiles[0] 
       : p.Profiles;
     ```
   - **Impact**: Robust handling of query responses

4. **Updated TypeScript Interfaces**
   - Modified 3 interfaces to reflect current schema
   - Changed from direct columns to nested Profile object
   - **Example**:
     ```typescript
     // OLD
     interface ParticipantInfo {
       name: string;
       flag: string;
       team_logo_url?: string;
     }
     
     // NEW
     interface ParticipantInfo {
       Profiles?: {
         name?: string | null;
         flag?: string | null;
         team?: string | null;
       } | null;
     }
     ```

#### Testing & Validation

- ✅ Build passes: `pnpm build` successful (5.89s)
- ✅ No TypeScript compilation errors
- ✅ All chunks within size limits
- ✅ Backward compatibility maintained with legacy properties

#### Migration Context

These updates align code with database migrations:
- `20251020142840_remove_flag_and_team_from_participants`
- `20251020150211_remove_name_from_participants`
- `20251020162722_rename_player_roles_to_home_away`

#### Notes

- **Old Migration Files**: Intentionally not modified (historical records)
- **Variable Names**: Local naming (`player1`, `player2`) kept for readability
- **Role Checks**: Code correctly uses "Home" and "Away" roles despite variable names
- **Test Files**: May need updates but not critical for production deployment

---

## October 20, 2025 - Schema Refactoring

### Participants Table Simplification

**Migrations Applied**:
- `remove_flag_and_team_from_participants`
- `remove_name_from_participants`
- `rename_player_roles_to_home_away`

**Changes**:
- Removed redundant columns from Participants (name, flag, team_logo_url)
- Established Profiles as single source of truth for user display data
- Renamed roles: 'Player1' → 'Home', 'Player2' → 'Away'

---

## October 20, 2025 - Friend System & Leaderboards

### New Tables Added

**Tables**:
- Friends - Friend request management
- Notifications - In-app notification system
- Matches - Historical match records
- PlayerSegmentStats - Per-segment performance tracking

**Views Created**:
- UserInbox - User notifications with sender info
- leaderboard_players - Player rankings
- leaderboard_matches - Match history with full details

---

## September 2025 - Initial Schema

**Created**: Core tables for quiz system
- Sessions, Participants, Scores, Strikes
- SegmentConfig, DailyRooms
- Profiles (linked to auth.users)
