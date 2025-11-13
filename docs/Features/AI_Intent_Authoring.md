# AI Intent-based Question Authoring

**Status**: ✅ Active  
**Category**: Features  
**Last Updated**: January 2025  
**Related Components**: `CreateQuestions.tsx`, `intentParser.ts`, `resolve-intent.mts`

---

## Overview

The AI Intent-based Question Authoring feature allows quiz hosts to generate football quiz questions using natural language prompts. The system uses a **rules-first approach** with optional LLM fallback, converting natural language into structured queries that fetch real data from Transfermarkt via cached APIs.

### Key Capabilities

- ✅ Natural language intent parsing (7 rule patterns)
- ✅ Structured Intent JSON generation
- ✅ Multi-task resolution (player stats, squads, achievements, multi-country titles)
- ✅ Transfermarkt API integration with caching
- ✅ Mock mode for fast development iteration
- ✅ Direct save to Supabase Questions table
- ✅ GameSetup integration with round count awareness
- ✅ WebGPU/WASM/CPU backend detection (optional transformers.js)

---

## Architecture

### Three-Stage Pipeline

```
User Prompt
    ↓
[1] Intent Parser (intentParser.ts)
    → Regex Rules (7 patterns) → Intent JSON
    → Optional LLM fallback if rules fail
    ↓
[2] Resolver (resolve-intent.mts)
    → Routes Intent to task-specific handler
    → Fetches data via transfermarktCache
    → Formats DB-ready payload
    ↓
[3] Save (CreateQuestions.tsx)
    → Insert into Questions table
    → Add to user's question_bank
    → Navigate to profile/setup
```

### Data Flow

```typescript
// 1. User types prompt
"What are the stats for Messi in Champions League season 2014/15?"

// 2. Intent Parser produces
{
  segment: "BELL",
  task: "player_stats_in_competition_season",
  constraints: {
    playerName: "Messi",
    competition: "Champions League",
    season: "2014/15"
  },
  timeframe: null,
  limit: null,
  metadata: { method: "rules", confidence: 0.95 }
}

// 3. Resolver fetches data
const player = await searchPlayerCached("Messi");
const stats = await getPlayerStatsCached(player.id, "2014/15");

// 4. Returns DB-ready payload
{
  segment_code: "BELL",
  question_text: "How many goals did Messi score in Champions League 2014/15?",
  answers: ["10", "12", "14", "16"],
  correct_answer_index: 1,
  api_source: "transfermarkt",
  total_answers_available: 4,
  answers_truncated: false
}
```

---

## Components

### 1. Intent Parser (`src/lib/ai/intentParser.ts`)

**Purpose**: Convert natural language to structured Intent JSON

**Strategy**: Rules-first with optional LLM fallback

#### Rule Patterns (7 total)

| Pattern | Example Prompt | Segment | Task |
|---------|----------------|---------|------|
| **BELL Stats** | "goals for Ronaldo in Champions League season 2017/18" | BELL | player_stats_in_competition_season |
| **WDYK Squad** | "Manchester United squad from 2007/08 season" | WDYK | club_squad_by_season |
| **REMO Multi-Country** | "won La Liga with Barcelona and Serie A with Juventus" | REMO | players_with_titles_multiple_countries |
| **UPDW Achievement** | "who won Ballon d'Or in 2023" | UPDW | achievement_by_year |
| **AUCT Before/After** | "players who won Champions League before 2010" | AUCT | players_with_trophy_before_after |
| **Generic Stats** | "goals scored by Lewandowski" | BELL | player_stats_generic |
| **Generic Trophy** | "Barcelona European Cup wins" | UPDW | club_trophy_count |

#### API

```typescript
export async function parseIntent(
  prompt: string,
  options?: {
    allowLLMFallback?: boolean; // default: false
    preferRules?: boolean;      // default: true
  }
): Promise<Intent>

export function validateIntent(intent: Intent): {
  valid: boolean;
  errors: string[];
}
```

#### Intent Type

```typescript
interface Intent {
  segment: SegmentCode;           // WDYK | BELL | REMO | UPDW | AUCT
  task: string;                   // e.g., "player_stats_in_competition_season"
  constraints: Record<string, unknown>; // Parsed entities (playerName, season, etc.)
  timeframe: {
    start?: string;
    end?: string;
    operator?: "before" | "after" | "between";
  } | null;
  limit: number | null;
  metadata: {
    method: "rules" | "llm";
    confidence?: number;
    [key: string]: unknown;
  };
}
```

#### Testing

```bash
pnpm test src/lib/ai/intentParser.test.ts
# All 11 tests passing ✅
```

---

### 2. Resolver Function (`netlify/functions/resolve-intent.mts`)

**Purpose**: Convert Intent JSON to DB-ready Questions payload

**Netlify Function**: `/.netlify/functions/resolve-intent`

#### Request Format

```typescript
POST /.netlify/functions/resolve-intent
Content-Type: application/json

{
  "intent": {
    "segment": "BELL",
    "task": "player_stats_in_competition_season",
    "constraints": {
      "playerName": "Messi",
      "competition": "Champions League",
      "season": "2014/15"
    }
  },
  "useMocks": false  // Optional: enable mock responses
}
```

#### Response Format

```typescript
{
  "segment_code": "BELL",
  "question_text": "How many goals did Messi score in Champions League 2014/15?",
  "answers": ["10", "12", "14", "16"],
  "correct_answer_index": 1,
  "api_source": "transfermarkt",
  "api_params": { /* intent constraints */ },
  "total_answers_available": 4,
  "answers_truncated": false
}
```

#### Task Handlers (5 total)

1. **resolvePlayerStats** - Player statistics in specific competition/season
2. **resolveClubSquadBySeason** - Full squad list for club in season
3. **resolvePlayersWithTitlesMultipleCountries** - Complex multi-league title queries
4. **resolveAfterBeforeQuery** - Players with trophy before/after year
5. **resolveAchievementByYear** - Individual achievement winners (Ballon d'Or, etc.)

#### Transfermarkt Cache Integration

All resolvers use cached helpers from `transfermarktCache.ts`:

```typescript
import {
  searchPlayerCached,
  getPlayerStatsCached,
  getClubPlayersCached,
  getPlayerAchievementsCached,
  getPlayerTransfersCached,
} from "../../src/lib/transfermarktCache";
```

---

### 3. CreateQuestions UI (`src/pages/CreateQuestions.tsx`)

**Purpose**: User interface for AI question authoring workflow

**Route**: `/create-questions`

#### Three-Step Workflow

1. **Parse Intent**: Convert prompt to Intent JSON
2. **Fetch Answers**: POST Intent to resolver, display generated question
3. **Save to DB**: Insert into Questions + question_bank tables

#### Navigation Context

When accessed from GameSetup (`/game-setup/:sessionCode`):

```typescript
navigate("/create-questions", {
  state: {
    sessionId: "uuid",
    sessionCode: "ABC123",
    roundCounts: {
      WDYK: 4,
      AUCT: 2,
      BELL: 10,
      UPDW: 10,
      REMO: 4
    }
  }
});
```

UI displays round counts and provides "Back to Setup" button.

#### Example Prompts Dropdown

5 pre-configured examples covering all task types:

- Player stats in competition season
- Club squad by season
- Achievement winner by year
- Multi-country title winners
- Players with trophy before/after year

#### Backend Detection

Auto-detects WebGPU support:

- ✅ WebGPU available → `🚀 GPU Accelerated` badge
- ❌ WebGPU unavailable → `💻 CPU Mode` badge
- 🧪 Mock mode enabled → `🧪 Mock Mode` badge

---

## Database Schema

### Questions Table

```sql
CREATE TABLE "Questions" (
  question_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_code TEXT NOT NULL,
  question_text TEXT NOT NULL,
  answers TEXT[] NOT NULL,
  correct_answer_index INTEGER,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  metadata JSONB,
  api_source TEXT CHECK (api_source IN ('manual', 'transfermarkt')),
  api_params JSONB,
  total_answers_available INTEGER,
  answers_truncated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### question_bank Table

Links questions to users for personal organization:

```sql
CREATE TABLE question_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  question_id UUID NOT NULL REFERENCES "Questions"(question_id),
  folder_name TEXT,
  tags TEXT[],
  is_favorite BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Usage Guide

### For Quiz Hosts (End Users)

1. **Enable Feature** (first time only):
   ```bash
   # In .env.local
   VITE_ENABLE_AI_AUTHORING=true
   ```

2. **Navigate to Create Questions**:
   - From Homepage: Click "Create Questions" link (if added)
   - From GameSetup: Click "🤖 Create Questions with AI" button

3. **Generate Question**:
   - Type natural language prompt (or use examples dropdown)
   - Click "Parse Intent" → Review Intent JSON
   - Click "Fetch Answers" → Review generated question
   - Click "Save Question" → Saved to your question bank

4. **Use in Quiz**:
   - Return to GameSetup
   - Open "📝 Manage Questions" modal
   - Select your AI-generated questions for each round

### For Developers

#### Enable Mock Mode (Fast Iteration)

```bash
# .env.local
VITE_USE_MOCKS=true
```

Mock mode returns hardcoded responses without hitting Transfermarkt API.

#### Run Tests

```bash
pnpm test src/lib/ai/intentParser.test.ts    # Intent parser
pnpm test netlify/functions/resolve-intent   # Resolver (if tests exist)
```

#### Debug Intent Parsing

```typescript
import { parseIntent } from "../lib/ai/intentParser";

const intent = await parseIntent(
  "goals for Ronaldo in Champions League season 2017/18",
  { allowLLMFallback: false, preferRules: true }
);

console.log(intent);
// { segment: "BELL", task: "player_stats_in_competition_season", ... }
```

#### Add New Rule Pattern

1. Add regex pattern to `intentParser.ts`:
   ```typescript
   const newPattern = /your_regex_here/i;
   const match = prompt.match(newPattern);
   if (match) {
     return {
       segment: "WDYK",
       task: "your_new_task",
       constraints: { /* extracted entities */ },
       timeframe: null,
       limit: null,
       metadata: { method: "rules", confidence: 0.9 }
     };
   }
   ```

2. Add test case to `intentParser.test.ts`:
   ```typescript
   it("should parse new pattern", async () => {
     const intent = await parseIntent("your test prompt");
     expect(intent.task).toBe("your_new_task");
   });
   ```

3. Add resolver handler to `resolve-intent.mts`:
   ```typescript
   async function resolveYourNewTask(intent: Intent): Promise<Question> {
     // Fetch data, format response
   }
   
   // In main resolveIntent()
   case "your_new_task":
     return await resolveYourNewTask(intent);
   ```

---

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_ENABLE_AI_AUTHORING` | ✅ Yes | `false` | Enable AI authoring feature flag |
| `VITE_USE_MOCKS` | ❌ No | `false` | Use mock responses (dev only) |
| `VITE_SUPABASE_DATABASE_URL` | ✅ Yes | - | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ Yes | - | Supabase anon key |

### Feature Flags

```typescript
// Check if enabled
const aiAuthoringEnabled = import.meta.env.VITE_ENABLE_AI_AUTHORING === "true";
const useMocks = import.meta.env.VITE_USE_MOCKS === "true";
```

---

## Troubleshooting

### "Failed to parse intent: No matching rules"

**Cause**: Prompt doesn't match any of the 7 regex patterns, and LLM fallback is disabled.

**Solutions**:
1. Rephrase prompt to match example patterns
2. Enable LLM fallback: `parseIntent(prompt, { allowLLMFallback: true })`
3. Add new regex pattern for your use case

---

### "transformers.js not installed"

**Cause**: Tried to use LLM fallback without installing optional dependency.

**Solution**:
```bash
pnpm add @xenova/transformers
```

Or disable LLM fallback (rules handle 90% of cases):
```typescript
parseIntent(prompt, { allowLLMFallback: false });
```

---

### "Failed to fetch answers: 500 Internal Server Error"

**Cause**: Resolver function error (likely Transfermarkt API issue).

**Debugging**:
1. Check Netlify function logs: `netlify dev` output
2. Enable mock mode to bypass API: `VITE_USE_MOCKS=true`
3. Test Transfermarkt cache helpers directly:
   ```typescript
   import { searchPlayerCached } from "../lib/transfermarktCache";
   const player = await searchPlayerCached("Messi");
   console.log(player);
   ```

---

### Questions Not Saving to Database

**Cause**: Supabase auth or permissions issue.

**Checks**:
1. User is logged in: `supabase.auth.getUser()`
2. RLS policies allow insert on `Questions` table
3. Check browser console for Supabase errors

---

## Performance Considerations

### Intent Parser

- **Rules-first**: ~5ms parse time (synchronous regex matching)
- **LLM fallback**: ~500-2000ms (WASM model inference)
- **Recommendation**: Use rules-first (90% coverage, 100x faster)

### Resolver Function

- **With cache hits**: ~100-300ms
- **Cold cache**: ~1-3 seconds (Transfermarkt API calls)
- **Mock mode**: ~50ms (hardcoded responses)

### Database Save

- **Questions insert**: ~100ms
- **question_bank insert**: ~100ms
- **Total save time**: ~200ms

---

## Future Enhancements

### Planned

- [ ] Batch question generation (5-10 questions per prompt)
- [ ] "Save to Round" dropdown in CreateQuestions UI
- [ ] Real-time question count chips in GameSetup
- [ ] Advanced filters (difficulty, date range, specific leagues)
- [ ] Question preview with AI-generated explanations
- [ ] Export questions to JSON/CSV

### Considered

- [ ] Voice input for prompts (Web Speech API)
- [ ] Multi-language support (translate prompts to English)
- [ ] Custom difficulty estimation (based on answer distribution)
- [ ] Auto-suggest prompts based on session segment counts

---

## Related Documentation

- **Parser Tests**: `/src/lib/ai/intentParser.test.ts`
- **Transfermarkt Cache**: `/docs/Libraries/CurrentState.md#transfermarktcachets`
- **Questions Schema**: `/docs/Database/CurrentState.md#questions-table`
- **GameSetup Integration**: `/docs/Pages/CurrentState.md#gamesetuptsx`

---

## Changelog

### January 2025 - Initial Implementation

- ✅ Created `intentParser.ts` with 7 regex patterns
- ✅ Built `resolve-intent.mts` Netlify function with 5 task handlers
- ✅ Wired CreateQuestions UI with parse → fetch → save workflow
- ✅ Integrated GameSetup with round count passing
- ✅ Added example prompts dropdown and backend detection badges
- ✅ All 11 intent parser tests passing
- ✅ Build verified and deployed

---

**Contributors**: Tareq (AI Assistant)  
**Last Review**: January 2025  
**Status**: Production-ready for private use
