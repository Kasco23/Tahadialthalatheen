# Developer Guide: AI Question Authoring

This guide covers local development setup for the **Create with AI** feature, which allows generating football quiz questions using natural language prompts.

## Table of Contents

- [Quick Start](#quick-start)
- [Architecture Overview](#architecture-overview)
- [Development Modes](#development-modes)
- [Environment Variables](#environment-variables)
- [Testing Locally](#testing-locally)
- [Mock Mode](#mock-mode)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites

- **Node.js 22+** (confirmed working: v22.19.0)
- **pnpm** (auto-enabled via corepack)
- **Netlify CLI** (installed via dependencies)

### Initial Setup

```bash
# 1. Install dependencies (takes ~2 seconds)
pnpm install --frozen-lockfile

# 2. Copy environment template
cp .env.example .env.local

# 3. Enable AI authoring feature
echo "VITE_ENABLE_AI_AUTHORING=true" >> .env.local

# 4. (Optional) Enable mock mode for faster iteration
echo "VITE_USE_MOCKS=true" >> .env.local

# 5. Start development server
pnpm dev
```

### Access the Feature

Once the dev server is running:

- **Homepage**: http://localhost:3000
- **Create Questions Page**: http://localhost:3000/create-questions

---

## Architecture Overview

### Frontend Components

- **`/src/pages/CreateQuestions.tsx`** - Main UI for AI question authoring
- **`/src/lib/aiUtils.ts`** - Client-side AI model handling and intent parsing

### Backend Functions

- **`/netlify/functions/resolve-intent.mts`** - Resolves parsed intents into concrete questions
  - Path: `/.netlify/functions/resolve-intent` or `/api/resolve-intent`
  - Supports mock mode for fast development

### Mock Data

- **`/src/fixtures/transfermarkt/`** - Mock question data for development
  - `generate_questions.json` - General football questions
  - `top_scorers.json` - Top scorer questions by league
  - `transfers.json` - Transfer-related questions
  - `team_squad.json` - Squad/lineup questions

---

## Development Modes

### Standard Dev Mode (Vite Only)

```bash
pnpm dev:vite
```

- **Port**: 5173
- **Functions**: ❌ Not available
- **Use case**: Frontend-only changes (UI, styling, routing)

### Full Dev Mode (Netlify Dev)

```bash
pnpm dev
```

- **Port**: 3000 (proxies to Vite on 5173)
- **Functions**: ✅ Available at `/.netlify/functions/*`
- **Use case**: Testing full AI workflow with backend integration
- **Hot Reload**: Both frontend and functions

### Functions Only

```bash
pnpm dev:functions
```

- **Use case**: Testing function changes in isolation
- **Note**: Frontend won't be available

---

## Environment Variables

### Required for AI Authoring

```bash
# Enable the AI authoring feature
VITE_ENABLE_AI_AUTHORING=true

# Use mock data instead of real APIs (faster dev)
VITE_USE_MOCKS=true
```

### Optional (for full integration)

```bash
# Supabase (for question storage)
VITE_SUPABASE_DATABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Transfermarkt API (if not using mocks)
# Add any required Transfermarkt API keys here
```

### How to Toggle Modes

**Enable AI Authoring + Mock Mode** (recommended for development):

```bash
# In .env.local
VITE_ENABLE_AI_AUTHORING=true
VITE_USE_MOCKS=true
```

**Enable AI Authoring + Real APIs**:

```bash
# In .env.local
VITE_ENABLE_AI_AUTHORING=true
VITE_USE_MOCKS=false
```

**Disable AI Authoring**:

```bash
# In .env.local
VITE_ENABLE_AI_AUTHORING=false
```

Changes to `.env.local` require restarting the dev server.

---

## Testing Locally

### 1. Test Frontend Only (Mock Mode)

```bash
# Terminal 1: Start dev server
pnpm dev

# Terminal 2: Run tests
pnpm test
```

**Test Flow**:

1. Navigate to http://localhost:3000/create-questions
2. Enter a prompt: *"Create 5 questions about Premier League top scorers"*
3. Click **Parse Intent** (model loads in ~1 second)
4. Review parsed intent (should show `task: "top_scorers"`)
5. Click **Generate Questions**
6. Verify mock questions appear from `src/fixtures/transfermarkt/top_scorers.json`

### 2. Test Full Workflow (Real APIs)

```bash
# Update .env.local
VITE_USE_MOCKS=false

# Restart dev server
pnpm dev
```

**Test Flow**:

1. Same steps as above
2. Backend will attempt to fetch real data from Transfermarkt
3. Questions will be dynamically generated

### 3. Test WebGPU Fallback

**Force CPU Mode**:

- Open DevTools Console
- Run: `navigator.gpu = undefined`
- Reload page
- Badge should show "💻 CPU Mode" instead of "🚀 GPU Accelerated"

---

## Mock Mode

### Why Use Mock Mode?

- **Speed**: No network requests, instant responses
- **Offline**: Work without internet or API keys
- **Predictable**: Same data every time for consistent testing
- **Cost**: No API rate limits or quotas

### How Mock Mode Works

When `VITE_USE_MOCKS=true`:

1. Frontend parses intent normally (client-side)
2. Backend receives intent task (e.g., `"top_scorers"`)
3. Instead of calling Transfermarkt API, it returns data from:
   ```
   src/fixtures/transfermarkt/{task}.json
   ```
4. Questions are instantly returned to frontend

### Adding New Mock Data

Mock fixtures are located in `src/fixtures/transfermarkt/` and contain **real, up-to-date football data** from the 2024-25 season for accurate testing.

**Current Fixtures**:
- `generate_questions.json` - General football questions (Golden Boot winners, transfers, records)
- `team_squad.json` - Current squad data for top clubs (Man City, Liverpool, Real Madrid, Arsenal)
- `transfers.json` - Recent transfer news and deals

**Data Accuracy**: Fixtures are manually curated with verified information. For production use, the Transfermarkt API integration will provide live data.

**Creating a New Fixture**:

```bash
# Create a new fixture file
touch src/fixtures/transfermarkt/my_new_task.json
```

```json
[
  {
    "question": "Your question here",
    "answer": "Your answer",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "difficulty": "medium",
    "category": "Your Category",
    "metadata": {
      "season": "2024-25",
      "source": "Official source or verification method"
    }
  }
]
```

Update `resolve-intent.mts` to handle the new task:

```typescript
case "my_new_task":
  return await handleMyNewTask(params);
```

---

## Troubleshooting

### Issue: "AI authoring is not enabled"

**Solution**: Add to `.env.local`:

```bash
VITE_ENABLE_AI_AUTHORING=true
```

Then restart dev server.

---

### Issue: Functions not available (404 on `/.netlify/functions/resolve-intent`)

**Solution**: Use full dev mode:

```bash
pnpm dev  # NOT pnpm dev:vite
```

Verify functions are running:

```bash
# Should list resolve-intent and other functions
netlify functions:list
```

---

### Issue: Model loading fails

**Symptoms**: Error on "Load Model First" or "Parse Intent"

**Solution**:

1. Check browser console for errors
2. Verify you're on a modern browser with ES2020+ support
3. For WebGPU issues, try forcing WASM mode (no code change needed - auto-fallback)

---

### Issue: Questions not saving to Supabase

**Symptoms**: "Questions saved successfully" but not in database

**Solution**: Check Supabase env vars in `.env.local`:

```bash
VITE_SUPABASE_DATABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Verify in DevTools Network tab that requests to Supabase succeed.

---

### Issue: Mock mode not working

**Symptoms**: Getting real API errors even with `VITE_USE_MOCKS=true`

**Solution**:

1. Verify `.env.local` has:
   ```bash
   VITE_USE_MOCKS=true
   ```
2. Restart dev server (env changes require restart)
3. Check browser DevTools → Application → Local Storage for `VITE_USE_MOCKS`
4. Check function logs:
   ```bash
   netlify functions:invoke resolve-intent --payload '{"task":"top_scorers","params":{},"useMocks":true}'
   ```

---

## Development Commands Reference

| Command                | Description                              | Port |
| ---------------------- | ---------------------------------------- | ---- |
| `pnpm dev`             | Full dev (Netlify + Vite + Functions)    | 3000 |
| `pnpm dev:vite`        | Vite only (no functions)                 | 5173 |
| `pnpm dev:functions`   | Functions only (no frontend)             | 8888 |
| `pnpm build`           | Production build                         | -    |
| `pnpm test`            | Run unit tests                           | -    |
| `pnpm test:e2e`        | Run E2E tests (requires setup)           | -    |
| `pnpm lint`            | Check for linting errors                 | -    |
| `pnpm format`          | Format code with Prettier                | -    |

---

## Expected URLs in Dev

| Resource                  | URL                                           |
| ------------------------- | --------------------------------------------- |
| Homepage                  | http://localhost:3000                         |
| Create Questions          | http://localhost:3000/create-questions        |
| Resolve Intent Function   | http://localhost:3000/.netlify/functions/resolve-intent |
| Vite Dev Server (direct)  | http://localhost:5173                         |

---

## Next Steps

- **Phase 2**: Replace rule-based parsing with tiny LLM (Transformers.js or WebLLM)
- **Phase 3**: Add Transfermarkt API integration for real-time data
- **Phase 4**: Implement question storage to Supabase
- **Phase 5**: Add bulk question generation and management UI

---

## Additional Resources

- [Netlify Functions Docs](https://docs.netlify.com/functions/overview/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Transformers.js](https://huggingface.co/docs/transformers.js)
- [WebLLM](https://github.com/mlc-ai/web-llm)

---

**Questions or issues?** Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) or open an issue on GitHub.
