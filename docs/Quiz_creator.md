# Quiz Creator – Functional & Technical Spec (for Copilot Agent)

## 0. Project context

- This repo powers a **1-vs-1 football quiz show**.
- Host uses a **PC** to control the quiz flow but joins video from a **phone** (Daily.co).
- Two players face off in multiple segments:
  - Single-answer trivia (e.g. “Who won the Ballon d’Or in 2024?”).
  - Finite-list questions (e.g. “Name all clubs in the 2024/25 Champions League league phase.”).
  - Ordered lists (e.g. “Name Ballon d’Or winners from most recent to oldest.”).
  - Identity / career-path guessing (e.g. “Name this player: Barcelona → PSG → Inter Miami.”).

- Stack:
  - Frontend: **React + Vite**, Tailwind CSS.
  - Backend: **Supabase** for game state, scores, host name, current phase.
  - **Netlify Functions** as API layer, including a wrapper around **Transfermarkt API** (see `TransferMarktOpenapi.json`).
  - Daily.co used for video (existing).

The goal here: build a **Quiz Creator** page that lets the host dynamically generate questions based on live data (players, clubs, competitions, stats) and clearly see the answer(s).

---

## 1. High-level goal

Create a page called **“Quiz Creator”** that is:

- Reachable from the existing **GameSetup** page (e.g. button/link “Open Quiz Creator”).
- A React page / route (e.g. `/quiz-creator` or nested route if appropriate).
- A configurable UI where the host can:
  1. Choose a **Question Type** (format).
  2. Choose a **Category** (players, clubs, competitions, etc.).
  3. Apply **filters** (season, competition, club, player name, position, etc.).
  4. Generate and preview:
     - The **question text** (what will be shown to contestants).
     - The **canonical correct answer(s)** (for the host and scoring logic).

  5. Optionally **save** the question to Supabase as part of a game configuration (if such a table exists / will be added).

No True/False questions. We only care about:

- “Who”
- “Which club/team”
- “How many”
- “Name all”
- “In which order”
- “Guess the player/manager”
- “Stat-based” questions (goals, assists, cards, etc.)

---

## 2. Data: Transfermarkt API (via Netlify)

**Important:** All calls should go through **Netlify Functions / backend**, not directly from the browser to Transfermarkt. Assume we’ll have or create serverless functions like:

- `/.netlify/functions/tm-players-search`
- `/.netlify/functions/tm-player-profile`
- `/.netlify/functions/tm-player-stats`
- `/.netlify/functions/tm-competitions-search`
- `/.netlify/functions/tm-competition-clubs`
- `/.netlify/functions/tm-clubs-search`
- `/.netlify/functions/tm-club-players`
- etc.

Based on `TransferMarktOpenapi.json`, we have at least:

- **Competitions**
  - `GET /competitions/search/{competition_name}` – search by name.
  - `GET /competitions/{competition_id}/clubs?season_id=...` – clubs in a competition/season.

- **Clubs**
  - `GET /clubs/search/{club_name}`
  - `GET /clubs/{club_id}/profile`
  - `GET /clubs/{club_id}/players?season_id=...`

- **Players**
  - `GET /players/search/{player_name}`
  - `GET /players/{player_id}/profile`
  - `GET /players/{player_id}/stats`
  - `GET /players/{player_id}/market_value`
  - `GET /players/{player_id}/transfers`
  - `GET /players/{player_id}/jersey_numbers`
  - `GET /players/{player_id}/injuries`
  - `GET /players/{player_id}/achievements`

Use these via a thin Netlify wrapper (TypeScript) that normalises responses and errors.

### Match results & events

- The attached Transfermarkt OpenAPI spec **does not expose match-by-match results or events**.
- Design the Quiz Creator with an abstraction for match data (e.g. `MatchDataProvider` or hooks like `useMatchResults`), but **do not hard-wire a specific external API** unless one already exists in the repo.
- If no match API is present, stub this layer so we can later plug in:
  - results,
  - scorers,
  - assisters,
  - card events,
  - minute events, etc.

---

## 3. Question Types / Formats

Define a **strongly-typed enum / union** in TypeScript for question types, e.g.:

```ts
type QuestionType =
  | "single_answer" // one (or very few) correct answers
  | "finite_list" // several correct items, finite set
  | "ordered_list" // list answers in correct chronological/numeric order
  | "career_path_guess" // guess a player/manager from club history
  | "stat_number" // how many goals/assists/cards/etc.
  | "stat_leader" // who leads in a stat under certain filters
  | "club_list" // name all clubs in X competition/season
  | "achievement_list"; // trophies/awards a player or club has
```

No True/False type.

For each `QuestionType`, create a config shape that describes:

- `category`: `"player" | "club" | "competition" | "national_team" | "stadium" | "country" | "city"` (even if not all are fully implemented yet).
- required inputs: which filters must the host fill in.
- which API calls to use.
- how to compute:
  - `questionText: string`
  - `correctAnswers: string[]`
  - optional `metaData` (e.g. `seasonId`, `competitionId`, `playerIds`, etc.)

Examples:

### a) Single answer

Examples:

- “Who won the Ballon d’Or in 2024?”
- “Which club does [PLAYER] currently play for?”
- “What is [PLAYER]’s primary position?”

Implementation:

- Use category: usually `player` or `club` or `competition`.
- Inputs:
  - For players: `playerName` (search & pick exact player).
  - For clubs: `clubName`.
  - For competitions: `competitionName`, `seasonId`.

- For now, Ballon d’Or data is **not** in Transfermarkt; treat that as manual / static or as future external data. Don’t hard-code a “current winner”; always parameterize by year.

### b) Finite list

Examples:

- “Name the clubs that played in the 2024/25 UEFA Champions League league phase.”
- “List all clubs currently in [LEAGUE] [SEASON].”
- “Name the nationalities of [PLAYER].”

Implementation:

- For competitions / clubs:
  - Use `/competitions/search/{competition_name}` → pick exact competition.
  - Use `/competitions/{competition_id}/clubs?season_id=...` → list of clubs.

- For player nationalities:
  - From `PlayerProfile.citizenship[]`.

### c) Ordered list

Examples:

- “Name the Ballon d’Or winners from 2024 back to 2015.”
- “Name the clubs [PLAYER] has played for in order of time.”
- “Name [CLUB] managers in order of tenure.” (if/when we have manager data or we approximate with `trainerProfile`).

Implementation ideas:

- Transfers:
  - `/players/{player_id}/transfers` gives you clubFrom/clubTo + date/season – derive chronological club list.

- Achievements:
  - `/players/{player_id}/achievements` lists trophies; you can sort by season.

### d) Career path guess (player/manager identity)

Examples:

- “Name this active player with this career path: Barcelona → PSG → Inter Miami.”
- “Which manager is this: Porto → Chelsea → Inter → Real Madrid?”

Implementation:

- For players:
  - Use transfers + youth clubs (`/players/{player_id}/transfers`).
  - Build a list of unique clubs in chronological order (ignore loan details initially unless you want to expose them).
  - Display clubs only, hide player name in host view vs. contestant view.

- For managers:
  - Where available via `trainerProfile` inside `PlayerProfile.trainerProfile`.
  - If no detailed manager API, this can be a manually-curated question type for now.

### e) Stat-number questions

Examples:

- “How many goals did [PLAYER] score in the 2022/23 Premier League?”
- “How many assists did [PLAYER] provide in the 2023/24 Champions League?”
- “How many yellow cards did [PLAYER] receive for [CLUB] this season in [COMPETITION]?”

Implementation:

- Use `/players/{player_id}/stats`.
- Pick the correct `PlayerStat` row by:
  - `competitionId` or `competitionName`
  - `seasonId`
  - `clubId` if needed.

- Fields available:
  - `appearances`, `goals`, `assists`, `yellowCards`, `redCards`, `minutesPlayed`.

### f) Stat-leader / ranking questions

Examples:

- “Which player has the highest market value at [CLUB]?”
- “Which player has the highest market value among these three?”

Implementation:

- Use:
  - club players: `/clubs/{club_id}/players?season_id=...` → has marketValue.
  - or `/players/{player_id}/market_value` for specific players.

- In UI, allow host to:
  - choose a club,
  - fetch squad + market values,
  - automatically find the top player(s).

---

## 4. Quiz Creator UI / UX

On the **Quiz Creator** page:

1. **Header / context**
   - Show current game info (if available from Supabase): host name, game ID, phase.
   - A clear link back to GameSetup.

2. **Question builder form**

   Rough layout (flex/columns):
   - **Question Type selector**
     - Dropdown or segmented buttons from the `QuestionType` union.

   - **Category selector**
     - e.g. “Players, Clubs, Competitions, Awards, Stats, Career path”.

   - **Dynamic filters** based on type + category:
     - Player selector (search box → hits Netlify Function → list of players).
     - Club selector (search).
     - Competition selector (search, then show seasons).
     - Season selector (free text or dropdown if you maintain a season list).
     - Additional fields like “stat type” (goals/assists/cards), or “include loans?” for career paths.

3. **Data preview pane**
   - Show raw/structured data returned from the backend:
     - e.g. list of clubs, stats rows, transfers list.

   - This is purely for the host to verify the data and debug API.

4. **Question output pane**
   - Live preview of:
     - `Question text`
     - `Correct answer(s)` (list/array)

   - Show also the “meta” object:

     ```ts
     {
       type: "stat_number",
       category: "player",
       competitionId: "...",
       seasonId: "...",
       playerId: "...",
       answer: 17
     }
     ```

5. **Actions**
   - “Copy to clipboard” button for:
     - Question text.
     - Answer(s).

   - “Save to game” button:
     - If there is an existing Supabase table for questions, upsert the question with:
       - gameId
       - order/index
       - questionType
       - payload/meta

   - If the game question table does not exist yet, create a TODO (see TODO section below) and stub the API call.

---

## 5. Integration with GameSetup

- GameSetup page likely configures:
  - host name,
  - game code / room,
  - players,
  - maybe starting phase.

- The Quiz Creator should:
  - either receive `gameId` via route state / params / global store,
  - or allow selecting/creating a game and then associating questions with it.

- Add a button in GameSetup:
  - Label: **“Open Quiz Creator”**
  - Navigates to the new Quiz Creator route while preserving game context (e.g. `?gameId=...`).

If there is a global game context (React context/Supabase subscription), prefer using that rather than re-fetching everything in Quiz Creator. There should be a limit to how much data is shown without the page lagging or slowing down. it should show up to 50 then upon click show "50 more" until all data is shown. A user can choose between the asmount of data shown at once (25, 50, 100, all). and by all it should show the actual amount and they should load in a way which doesn'T cause performance issues.

---

## 6. Technical style & conventions

- Use TypeScript everywhere.
- Use React function components with hooks.
- Use Tailwind for styling.
- Prefer small, composable components:
  - `QuestionTypeSelector`
  - `PlayerSearchInput`
  - `CompetitionSeasonPicker`
  - `DataPreviewPanel`
  - `QuestionPreviewCard`

- Create a small client library for backend calls:
  - `src/lib/tmClient.ts` (for Netlify function calls).
  - Keep all Transfermarkt-related types in one place (`src/lib/tmTypes.ts`) based on the OpenAPI schemas.

---

## 7. TODO generation (for Copilot)

When you (Copilot) implement this, please:

1. **Create a clear TODO list in the codebase**, e.g. in `quiz-creator` related files, using comments like:

   ```ts
   // TODO(quiz-creator): Implement saving questions to Supabase
   // TODO(quiz-creator): Wire up real match-results API once available
   ```

2. Group TODOs by concern:
   - `// TODO(quiz-creator-ui): ...`
   - `// TODO(quiz-creator-api): ...`
   - `// TODO(quiz-creator-data): ...`

3. Refer back to this document (e.g. `docs/quiz-creator-spec.md`) whenever you:
   - need to know supported `QuestionType`s,
   - need to know which endpoints map to which question formats,
   - are unsure about including/excluding True/False questions (they are excluded).

4. Prefer small PR-sized steps:
   - First: scaffolding route + barebones UI.
   - Second: wiring up 1–2 question types (e.g. `finite_list` + `career_path_guess`).
   - Third: adding stat-based types.
   - Fourth: integrate with Supabase (if not already).

---

## 8. Out of scope (for now)

- Do **not** implement True/False questions.
- Do **not** depend on a specific Ballon d’Or endpoint; keep Ballon d’Or questions parameterised by year and allow for manual data entry for now.
- Do **not** hard-code match results; design a clean abstraction but it’s okay if it’s stubbed initially.

# End of spec
