# Transfermarkt API Integration Roadmap

## 🎯 Project Overview

**Goal**: Build semi-automatic football quiz question generator using Transfermarkt Open API

**API Base**: `https://transfermarkt-api.fly.dev`  
**Auth**: None required ✅  
**Rate Limits**: TBD (test during implementation)

---

## 📊 API Endpoint Mapping to Quiz Segments

### Core Data Retrieval Endpoints

| Endpoint                       | Purpose                                  | Quiz Segments  |
| ------------------------------ | ---------------------------------------- | -------------- |
| `/players/search/{name}`       | Find player by name                      | ALL            |
| `/players/{id}/profile`        | Full player details                      | BELL, UPDW     |
| `/players/{id}/transfers`      | Career path (clubs chronologically)      | **REMO** ⭐    |
| `/players/{id}/stats`          | Goals/assists by competition/season/club | **BELL**, WDYK |
| `/players/{id}/achievements`   | Titles won                               | WDYK, AUCT     |
| `/players/{id}/jersey_numbers` | Jersey numbers per club/season           | UPDW, BELL     |
| `/clubs/search/{name}`         | Find club                                | AUCT, WDYK     |
| `/clubs/{id}/players`          | Squad list                               | WDYK, AUCT     |
| `/competitions/search/{name}`  | Find competition                         | Context        |
| `/competitions/{id}/clubs`     | Clubs in competition                     | AUCT, WDYK     |

---

## 🏗️ Architecture Design

### Phase 1: API Wrapper Layer

**File**: `src/lib/api/transfermarkt.ts`

```typescript
// Base client with caching
class TransfermarktClient {
  baseURL = "https://transfermarkt-api.fly.dev";

  // Core methods
  async searchPlayer(name: string): Promise<PlayerSearchResult[]>;
  async getPlayerProfile(id: string): Promise<PlayerProfile>;
  async getPlayerTransfers(id: string): Promise<PlayerTransfers>;
  async getPlayerStats(id: string): Promise<PlayerStats>;
  async getPlayerAchievements(id: string): Promise<PlayerAchievements>;
  async getPlayerJerseyNumbers(id: string): Promise<PlayerJerseyNumbers>;

  async searchClub(name: string): Promise<ClubSearchResult[]>;
  async getClubPlayers(id: string, season?: string): Promise<ClubPlayers>;

  async searchCompetition(name: string): Promise<CompetitionSearchResult[]>;
  async getCompetitionClubs(
    id: string,
    season?: string,
  ): Promise<CompetitionClubs>;
}
```

### Phase 2: Netlify Blobs Caching Strategy

**Why Blobs?**

- API responses can be large (player stats = 100+ records)
- Avoid rate limits by caching frequently accessed data
- Store player IDs, club IDs, competition IDs for quick lookup

**Blob Structure**:

```
transfermarkt/
├── players/
│   ├── {player_id}/
│   │   ├── profile.json (TTL: 7 days)
│   │   ├── transfers.json (TTL: 30 days - static)
│   │   ├── stats.json (TTL: 1 day)
│   │   └── achievements.json (TTL: 7 days)
├── clubs/
│   └── {club_id}/
│       ├── profile.json (TTL: 7 days)
│       └── players_{season}.json (TTL: 1 day)
├── competitions/
│   └── {competition_id}/
│       └── clubs_{season}.json (TTL: 7 days)
└── search-cache/
    ├── player_{name_hash}.json (TTL: 1 hour)
    └── club_{name_hash}.json (TTL: 1 hour)
```

### Phase 3: Question Generator Functions

**Netlify Functions** (one per segment):

1. **`generate-remontada-question.mts`** (REMO)
   - Input: `player_name` or `player_id`
   - Fetch `/players/{id}/transfers`
   - Extract club names chronologically
   - Return question + answer

2. **`generate-auction-question.mts`** (AUCT)
   - Input: `leagues[]` or `achievement_type`
   - Example: "Players who played in 2+ leagues"
   - Fetch multiple players, filter by transfers
   - Return question + answers array

3. **`generate-bell-question.mts`** (BELL)
   - Input: `stat_type`, `competition`, `season`
   - Example: "Most goals in La Liga 2023/24"
   - Fetch player stats, find top scorer
   - Return question + single correct answer

4. **`generate-updw-question.mts`** (UPDW)
   - Input: `trivia_type`
   - Example: "Most CL finals lost"
   - Complex queries (manual curated + API verification)
   - Return question + answer

5. **`generate-wdyk-question.mts`** (WDYK)
   - Input: `achievement_type` or `club_id` + `season`
   - Example: "Name all players who won 2014 World Cup"
   - Fetch club/competition squads or achievements
   - Return question + answers array

### Phase 4: Frontend UI - Question Generator Tool

**New Page**: `/tools/question-generator`  
**Access**: Host only (in GameSetup page)

**UI Flow**:

1. Select segment (REMO, WDYK, AUCT, BELL, UPDW)
2. Choose template or enter custom parameters
3. Click "Generate Question"
4. Preview question + answers
5. Edit if needed
6. Save to Questions table with metadata

**Component Structure**:

```
src/pages/tools/
├── QuestionGeneratorPage.tsx (main page)
├── components/
│   ├── SegmentSelector.tsx
│   ├── RemontadaGenerator.tsx
│   ├── AuctionGenerator.tsx
│   ├── BellGenerator.tsx
│   ├── UpDownGenerator.tsx
│   ├── WDYKGenerator.tsx
│   ├── QuestionPreview.tsx
│   └── AnswerLimitHandler.tsx (for 100+ answers)
```

---

## 🗃️ Database Schema Updates

### New Tables

#### 1. `generated_questions` (Track generated questions)

```sql
CREATE TABLE public.generated_questions (
  generated_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES public."Questions"(question_id),
  profile_id UUID REFERENCES public."Profiles"(profile_id),
  session_id UUID REFERENCES public."Sessions"(session_id),

  -- API metadata
  api_source TEXT DEFAULT 'transfermarkt',
  api_params JSONB, -- Store original generation params
  generated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Answer metadata
  total_answers_count INTEGER, -- Total from API (might be 500+)
  displayed_answers_count INTEGER, -- How many shown (max 100)
  answers_expanded BOOLEAN DEFAULT FALSE, -- If user requested full list

  -- Usage tracking
  used_in_quiz BOOLEAN DEFAULT FALSE,
  difficulty_rating REAL, -- Player feedback

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_generated_questions_profile ON public.generated_questions(profile_id);
CREATE INDEX idx_generated_questions_session ON public.generated_questions(session_id);
```

#### 2. `question_bank` (User's personal question collection)

```sql
CREATE TABLE public.question_bank (
  bank_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public."Profiles"(profile_id) NOT NULL,
  question_id UUID REFERENCES public."Questions"(question_id),

  -- Organization
  folder_name TEXT, -- User-created folders
  tags TEXT[], -- ["champions-league", "strikers", "hard"]
  is_favorite BOOLEAN DEFAULT FALSE,

  -- Stats
  times_used INTEGER DEFAULT 0,
  avg_player_score REAL,
  last_used_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_question_bank_profile ON public.question_bank(profile_id);
CREATE INDEX idx_question_bank_tags ON public.question_bank USING GIN(tags);
```

#### 3. `player_question_history` (Questions seen as player)

```sql
CREATE TABLE public.player_question_history (
  history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public."Profiles"(profile_id) NOT NULL,
  session_id UUID REFERENCES public."Sessions"(session_id),
  question_id UUID REFERENCES public."Questions"(question_id),

  -- Performance
  answered_correctly BOOLEAN,
  time_taken_seconds INTEGER,
  score_received INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_player_history_profile ON public.player_question_history(profile_id);
CREATE INDEX idx_player_history_session ON public.player_question_history(session_id);
```

#### 4. Update `Questions` table with API metadata

```sql
ALTER TABLE public."Questions"
ADD COLUMN IF NOT EXISTS api_source TEXT,
ADD COLUMN IF NOT EXISTS api_params JSONB,
ADD COLUMN IF NOT EXISTS total_answers_available INTEGER,
ADD COLUMN IF NOT EXISTS answers_truncated BOOLEAN DEFAULT FALSE;
```

---

## 📋 Implementation TODO List

### Phase 1: Foundation (Sessions 1-2)

- [x] Research Transfermarkt API ✅
- [ ] **1.1** Create `src/lib/api/transfermarkt.ts` wrapper
- [ ] **1.2** Implement basic client with fetch + error handling
- [ ] **1.3** Create TypeScript types from OpenAPI spec
- [ ] **1.4** Test all core endpoints with real queries
- [ ] **1.5** Document endpoint response shapes

### Phase 2: Caching Layer (Session 3)

- [ ] **2.1** Design Netlify Blobs structure
- [ ] **2.2** Create `src/lib/api/transfermarktCache.ts`
- [ ] **2.3** Implement cache wrapper with TTL logic
- [ ] **2.4** Add cache key generation (hash player names)
- [ ] **2.5** Test cache hit/miss scenarios

### Phase 3: Database Setup (Session 4)

- [ ] **3.1** Create migration for `generated_questions` table
- [ ] **3.2** Create migration for `question_bank` table
- [ ] **3.3** Create migration for `player_question_history` table
- [ ] **3.4** Update `Questions` table schema
- [ ] **3.5** Add RLS policies for all new tables
- [ ] **3.6** Generate TypeScript types

### Phase 4: REMO Question Generator (Session 5)

- [ ] **4.1** Create `netlify/functions/generate-remontada-question.mts`
- [ ] **4.2** Implement career path extraction logic
- [ ] **4.3** Add club name cleaning (remove years, etc.)
- [ ] **4.4** Test with multiple players (Henry, Nainggolan, Ibrahimovic)
- [ ] **4.5** Add metadata tracking

### Phase 5: BELL Question Generator (Session 6)

- [ ] **5.1** Create `netlify/functions/generate-bell-question.mts`
- [ ] **5.2** Implement stat-based question templates
- [ ] **5.3** Add competition filtering
- [ ] **5.4** Test with current season data
- [ ] **5.5** Handle tied answers

### Phase 6: WDYK/AUCT Generator (Session 7)

- [ ] **6.1** Create `netlify/functions/generate-wdyk-question.mts`
- [ ] **6.2** Create `netlify/functions/generate-auction-question.mts`
- [ ] **6.3** Implement multi-league filtering
- [ ] **6.4** Add achievement-based queries
- [ ] **6.5** Handle 100+ answer scenarios

### Phase 7: UPDW Generator (Session 8)

- [ ] **7.1** Create `netlify/functions/generate-updw-question.mts`
- [ ] **7.2** Implement trivia templates
- [ ] **7.3** Add manual verification workflow
- [ ] **7.4** Test with edge cases

### Phase 8: Frontend UI - Generator Tool (Sessions 9-10)

- [ ] **8.1** Create `/tools/question-generator` page structure
- [ ] **8.2** Build SegmentSelector component
- [ ] **8.3** Build RemontadaGenerator component
- [ ] **8.4** Build BellGenerator component
- [ ] **8.5** Build WDYKGenerator component
- [ ] **8.6** Build AuctionGenerator component
- [ ] **8.7** Build UpDownGenerator component
- [ ] **8.8** Build QuestionPreview component
- [ ] **8.9** Implement AnswerLimitHandler (100+ warning)
- [ ] **8.10** Add save to Questions table functionality

### Phase 9: GameSetup Integration (Session 11)

- [ ] **9.1** Add "Generate Questions" button in GameSetup
- [ ] **9.2** Create modal/drawer for question generator
- [ ] **9.3** Integrate with existing QuestionManager
- [ ] **9.4** Add answer expansion UI (show 100, expand to all)
- [ ] **9.5** Save generated questions with session association

### Phase 10: Profile Features (Session 12)

- [ ] **10.1** Create "My Questions" page in Profile
- [ ] **10.2** Show questions created as host
- [ ] **10.3** Show questions answered as player
- [ ] **10.4** Add folder/tag organization
- [ ] **10.5** Add stats (usage, difficulty ratings)

### Phase 11: Testing & Refinement (Session 13)

- [ ] **11.1** E2E test: Generate REMO question
- [ ] **11.2** E2E test: Generate AUCT question with 200+ answers
- [ ] **11.3** E2E test: Save to question bank
- [ ] **11.4** E2E test: Use generated question in quiz
- [ ] **11.5** Performance testing (API + cache)

### Phase 12: Documentation (Session 14)

- [ ] **12.1** Update `/docs/FOOTBALL_DATA_SOURCES.md`
- [ ] **12.2** Create `/docs/QUESTION_GENERATOR_GUIDE.md`
- [ ] **12.3** Document API wrapper usage
- [ ] **12.4** Create user guide for hosts
- [ ] **12.5** Update Components/CurrentState.md

---

## 🔗 Data Flow Examples

### Example 1: Generate REMO Question

```
User Input → Netlify Function → Transfermarkt API → Cache → Response
```

1. Host enters "Thierry Henry" in REMO generator
2. Frontend calls `/api/generate-remontada-question?name=thierry%20henry`
3. Function checks Blobs cache for `players/3207/transfers.json`
4. If miss: Fetch from `https://transfermarkt-api.fly.dev/players/3207/transfers`
5. Extract club sequence: Monaco → Juventus → Arsenal → Barcelona → NY Red Bulls
6. Return:

```json
{
  "segment": "REMO",
  "question": "Name the retired striker: AS Monaco, Juventus, Arsenal, Barcelona, New York Red Bulls",
  "answer": "Thierry Henry",
  "api_params": {
    "player_id": "3207",
    "player_name": "Thierry Henry",
    "clubs_count": 5
  }
}
```

### Example 2: Generate AUCT Question with 200+ Answers

```
User Input → Function → Multiple API Calls → Filter → Limit → Response
```

1. Host selects "Players who played in 2+ leagues: La Liga, Premier League, Bundesliga"
2. Function queries players from each league (3 separate calls)
3. Cross-reference to find players appearing in 2+ lists
4. Result: 247 players found
5. Return:

```json
{
  "segment": "AUCT",
  "question": "Name players who played in at least 2 of: La Liga, Premier League, Bundesliga",
  "answers": ["Thibaut Courtois", "Cesc Fàbregas", ...], // First 100
  "total_answers_available": 247,
  "answers_truncated": true,
  "api_params": {
    "leagues": ["ES1", "GB1", "L1"],
    "min_leagues": 2
  }
}
```

---

## 🎨 UI/UX Design Principles

### Answer Limit Handling (100+ Answers)

**Scenario**: Generated question has 247 possible answers

**UI Flow**:

1. Show first 100 answers in preview
2. Display banner: "⚠️ This question has 247 possible answers. Only 100 are shown. Want to see all?"
3. Options:
   - "Show All" → Expands to full list (use with caution for quiz)
   - "Keep 100" → Saves with truncated list
   - "Refine Question" → Go back and add more filters

**Database Behavior**:

- `total_answers_available`: 247
- `answers_truncated`: true
- `answers`: Array of 100 (or all if expanded)

### Question Templates

**REMO Templates**:

- "Name the player: [club1], [club2], [club3]..."
- "Which retired striker played for: [clubs]?"

**BELL Templates**:

- "Who is the top scorer in [competition] [season]?"
- "Which player has the most assists in [competition]?"

**AUCT/WDYK Templates**:

- "Name players who played for [club] and [club]"
- "Name players who won [achievement]"
- "Name players who played in 2+ of: [leagues]"

---

## 🧪 Testing Strategy

### Unit Tests

- API wrapper functions
- Cache key generation
- Data transformation logic

### Integration Tests

- Netlify functions with mock API responses
- Database operations
- Blob cache read/write

### E2E Tests

1. Generate question → Save → Use in quiz
2. Generate 200+ answer question → Expand → Save
3. View "My Questions" in profile
4. Filter question bank by tags

---

## 📊 Success Metrics

- [ ] Generate REMO question in <3 seconds
- [ ] Generate AUCT question with 100+ answers in <5 seconds
- [ ] Cache hit rate >80% after 1 week
- [ ] <5% error rate on API calls
- [ ] Host can create 10 questions in <5 minutes

---

## 🚀 Next Immediate Steps

1. **Create API wrapper** (`src/lib/api/transfermarkt.ts`)
2. **Test core endpoints** (search player, get transfers, get stats)
3. **Design cache structure** in Netlify Blobs
4. **Create database migrations** for new tables

---

**Estimated Timeline**: 14 sessions (~20-30 hours)  
**Priority**: High  
**Complexity**: Medium-High  
**Dependencies**: Transfermarkt API stability, Netlify Blobs, Supabase
