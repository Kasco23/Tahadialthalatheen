# Netlify Functions

This directory contains serverless functions that run on Netlify Edge Functions platform using Node.js 22.

## Structure & ESM Usage

All functions use **ES Modules** (`type: "module"` in root package.json) and export a default async function:

```typescript
export default async (event, context) => {
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message: 'Hello World' })
  };
};
```

## Available Functions

- **health-check.ts** - Basic health check endpoint returning runtime info
- **create-session.ts** - Creates new game sessions
- **join-session.ts** - Handles player joining logic
- **game-event.ts** - Game event tracking (public)
- **game-event-secure.ts** - Authenticated game event handling
- **daily-rooms.ts** - Daily.co video room management
- **supabase-health.ts** - Supabase connection health check

## Development

Functions are automatically built by Netlify using esbuild. TypeScript files (`.ts`) are supported out of the box.

Local development: `pnpm dev:netlify`

## Authentication

Functions requiring authentication use the `_auth.ts` helper module for Supabase JWT validation.