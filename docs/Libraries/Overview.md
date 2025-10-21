# Libraries - Overview

**Category**: Business logic, utilities, and API clients  
**Location**: `/src/lib/`  
**Total Files**: 25+ library files

---

## Purpose

Libraries contain the core business logic, API integrations, utility functions, and type definitions. These are pure TypeScript modules (no JSX) that can be imported by any component or page.

---

## Key Libraries

### Database Operations

- **mutations.ts** (largest, ~30KB) - All Supabase database operations
- **sessionHooks.ts** - React hooks for session state management
- **userSession.ts** - User session utilities
- **activeProfile.ts** - Active profile management
- **blobStore.ts** - Netlify Blobs storage operations

### Real-time Features

- **presence.ts** - Participant presence system
- **realtimeHooks.ts** - Supabase real-time subscriptions
- **sessionState.ts** - Session state management via edge functions

### Social Features

- **friends.ts** - Friend request and management logic
- **matches.ts** - Match recording and retrieval
- **notifications.ts** - User notification system

### Video Integration

- **dailyTokenManager.ts** - Daily.co token management
- **useDailyToken.ts** - React hook for Daily tokens

### Utilities

- **logger.ts** - Logging utility
- **flagHelper.ts** - Flag-related utilities
- **flagIcons.ts** - Flag icon mappings
- **teamLogoHelper.ts** - Team logo utilities
- **joinHelpers.ts** - Session join logic
- **roleUtils.ts** - Role-based access control
- **participantAuth.ts** - Participant authentication

### Type Definitions

- **types.ts** - Core application types
- **types/index.ts** - Exported types
- **types/supabase.ts** - Supabase database types

### Configuration

- **supabaseClient.ts** - Supabase client initialization

---

## See Also

- **CurrentState.md** - Detailed library specifications
- **Changelog.md** - Recent changes
- **Deprecated.md** - Removed libraries

_Full documentation for this category coming soon..._
