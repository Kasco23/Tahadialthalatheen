## ⚡ Supabase Mutations Prompts for Copilot

### 1. Create Session (Host PC → GameSetup)

> **Prompt:**
> "In `src/lib/mutations.ts`, add a function `createSession(hostPassword: string)` that:
>
> * Inserts a new row into `Session` with `host_password` and defaults (`phase='GameSetup'`, `game_state='pre-quiz'`).
> * Returns the `session_id`.
>   Replace file if exists."

---

### 2. Add Segment Config (GameSetup)

> **Prompt:**
> "In `src/lib/mutations.ts`, add a function `setSegmentConfig(sessionId: string, configs: { segment_code: string, questions_count: number }[])` that upserts into `SegmentConfig`.
> Use Supabase `.upsert()` with `session_id` and `segment_code`.
> Replace if function already exists."

---

### 3. Create Daily Room (GameSetup → Netlify Function)

> **Prompt:**
> "In `src/lib/mutations.ts`, add a function `createDailyRoom(sessionId: string)` that:
>
> * Calls Netlify function `/api/createDailyRoom` with `{ sessionId }`.
> * Inserts/updates `DailyRoom` table with the returned `room_url`.
>   Replace if exists."

---

### 4. Join as Host (Phone → Join)

> **Prompt:**
> "In `src/lib/mutations.ts`, add a function `joinAsHost(sessionId: string, password: string, hostName: string)` that:
>
> * Calls Supabase RPC `verify_host_password(sessionId, password)`.
> * If valid, inserts into `Participant` with `role='Host'`, `name=hostName`.
> * Returns participant\_id.
>   Replace if exists."

---

### 5. Join as Player (Phone → Join)

> **Prompt:**
> "In `src/lib/mutations.ts`, add a function `joinAsPlayer(sessionId: string, name: string, flag: string, logoUrl: string)` that:
>
> * Checks how many players exist for that session. Assign role='Player1' if none, else 'Player2'.
> * Inserts into `Participant` with `name`, `role`, `flag`, `team_logo_url`.
> * Returns participant\_id.
>   Replace if exists."

---

### 6. Update Presence (Lobby & Call)

> **Prompt:**
> "In `src/lib/mutations.ts`, add functions:
>
> * `updateLobbyPresence(participantId: string, status: 'NotJoined' | 'Joined' | 'Disconnected')` → updates `lobby_presence`.
> * `updateVideoPresence(participantId: string, connected: boolean)` → updates `video_presence`.
>   Replace if exists."

---

### 7. Update Phase / Game State (Host actions)

> **Prompt:**
> "In `src/lib/mutations.ts`, add a function `updatePhase(sessionId: string, phase: string, gameState?: string)` that updates `Session.phase` (and optionally `Session.game_state`).
> Only host should call this.
> Replace if exists."

---

### 8. Update Score (Quiz)

> **Prompt:**
> "In `src/lib/mutations.ts`, add a function `updateScore(sessionId: string, participantId: string, segmentCode: string, points: number)` that:
>
> * Uses Supabase `.upsert()` into `Score` with `(session_id, participant_id, segment_code)`.
> * Adds the new points to existing points.
>   Replace if exists."

---

### 9. Use Powerup (Quiz)

> **Prompt:**
> "In `src/lib/mutations.ts`, add a function `usePowerup(participantId: string, powerup: 'pass' | 'alhabeed' | 'bellegoal' | 'slippyg')` that updates the corresponding boolean column in `Participant` to true.
> Replace if exists."

---

### 10. End Session

> **Prompt:**
> "In `src/lib/mutations.ts`, add a function `endSession(sessionId: string)` that updates `Session.game_state='concluded'`.
> Replace if exists."

