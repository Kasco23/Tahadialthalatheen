# Database - Changelog

**Last Updated**: January 24, 2025

---

## January 24, 2025 - Transfermarkt API Integration Database Schema

### Added Question Generation Support Tables and Migration

**Type**: Feature Enhancement  
**Impact**: Major - Enables semi-automatic quiz question generation via Transfermarkt API  
**Phase**: 3 of 14 (Transfermarkt Integration Roadmap)

#### Migration File Created

**File**: `/supabase/migrations/20251030120625_add_question_generation_support.sql`

**Migration Details**:

1. **Questions Table Updates**:
   - Added `api_source` TEXT CHECK ('manual', 'transfermarkt') - Source of question
   - Added `api_params` JSONB - JSON parameters used to generate question
   - Added `total_answers_available` INTEGER - Total valid answers (for 100+ scenarios)
   - Added `answers_truncated` BOOLEAN - Whether answer list was truncated
   - Added indexes: `idx_questions_api_source`, `idx_questions_truncated`
   - Set default `api_source = 'manual'` for existing questions

2. **question_bank Table**:
   - Purpose: User question collections with folders/tags/favorites
   - Columns: id, user_id, question_id, folder_name, tags[], is_favorite, notes, created_at, updated_at
   - Indexes: user_id, question_id, folder_name, is_favorite (partial), tags (GIN)
   - Unique constraint: (user_id, question_id)

3. **player_question_history Table**:
   - Purpose: Track player performance on questions (statistics and difficulty)
   - Columns: id, user_id, question_id, session_id, answered_correctly, time_taken_seconds, points_earned, created_at
   - Indexes: user_id, question_id, session_id, answered_correctly
   - Composite indexes: (user_id, answered_correctly), (question_id, answered_correctly)

4. **generated_questions_metadata Table**:
   - Purpose: Metadata for API-generated questions (caching, performance, freshness)
   - Columns: id, question_id (UNIQUE), generator_function, api_endpoint, cache_hit, generation_time_ms, data_freshness, created_by, created_at
   - Indexes: question_id, generator_function, created_by

5. **RLS Policies**:
   - question_bank: Users can CRUD their own bank entries
   - player_question_history: Users can view own history, question creators can view stats
   - generated_questions_metadata: Public read, authenticated users can create

6. **Views**:
   - `question_performance_stats`: Aggregated performance per question (attempts, correct %, avg time)
   - `user_question_bank_detailed`: User question bank with full details + API metadata

7. **Helper Functions**:
   - `get_question_difficulty(question_uuid UUID)`: Calculate difficulty (Easy/Medium/Hard/Very Hard) based on correct answer rate

#### TypeScript Types Update

**File**: `/src/lib/types/supabase.ts`

**Changes**:

- Added `Questions` table type with all new columns
- Added `question_bank` table type
- Added `player_question_history` table type
- Added `generated_questions_metadata` table type
- Added `question_performance_stats` view type
- Added `user_question_bank_detailed` view type
- Added `get_question_difficulty` function type

**Build Status**: ✅ Build successful (pnpm build passed)

#### Integration Context

**Previous Phases Completed**:

- ✅ Phase 1: API wrapper (transfermarkt.ts) - 10 methods tested
- ✅ Phase 2: Caching layer (transfermarktCache.ts) - 4-tier TTL strategy

**Current Phase Status**:

- ✅ Phase 3.1: Migration file created
- ✅ Phase 3.2: TypeScript types updated
- ⚠️ Phase 3.3: Migration needs to be applied to Supabase

**Next Steps**:

- Apply migration to Supabase database
- Create 5 generator Netlify functions (Phase 4-7)
- Build QuestionGenerator UI component (Phase 8-9)

#### Technical Decisions

**api_source Design**:

- Used TEXT with CHECK constraint instead of ENUM for flexibility
- Allows 'manual' (user-created) vs 'transfermarkt' (API-generated) distinction

**api_params Structure**:

- JSONB for flexible parameter storage (player_id, leagues[], seasons[], etc.)
- Enables recreating questions or checking duplicates

**RLS Strategy**:

- Question history: Users see own data + question creators see aggregate stats
- Question bank: Private per user
- Metadata: Public read for transparency

**Performance Considerations**:

- GIN index on tags[] for fast tag-based queries
- Partial index on is_favorite (only TRUE values)
- Composite indexes for common query patterns (user performance, question difficulty)

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
     const profileData = Array.isArray(p.Profiles) ? p.Profiles[0] : p.Profiles;
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
