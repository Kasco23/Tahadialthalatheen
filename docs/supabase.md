# Supabase Config and Information

## Project Details

- **Project ID**: zgvmkjefgdabumvafqch
- **Project Path**: /home/tareq/Desktop/thirty-challenge-code/supabase
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Real-time**: Enabled for all tables

## Database Schema

### Core Tables

#### `games` Table

Stores game session information:

```sql
- id (text, primary key)
- host_id (text, references auth.users)
- status (text: 'waiting', 'active', 'completed')
- current_segment (text)
- settings (jsonb) -- NEW: Game configuration
- video_room_url (text)
- created_at (timestamptz)
- last_activity (timestamptz) -- NEW: For cleanup and monitoring
```

#### `players` Table

Linked to games, stores player information:

```sql
- id (text, primary key)
- game_id (text, references games.id)
- user_id (text, references auth.users)
- display_name (text)
- score (integer)
- is_host (boolean)
- last_seen (timestamptz) -- NEW: Session tracking
- session_id (text) -- NEW: Multiple session support
- connection_status (text) -- NEW: 'online'|'offline'|'away'
- created_at (timestamptz)
```

#### `game_events` Table

Stores each question/answer event and game actions:

```sql
- id (uuid, primary key)
- game_id (text, references games.id)
- event_type (text)
- data (jsonb)
- timestamp (timestamptz)
- player_id (text, references players.id) -- NEW: Event attribution
- sequence_number (integer) -- NEW: Event ordering
- metadata (jsonb) -- NEW: Additional context
```

#### `rooms` Table ✨ NEW

Manages Daily.co video room integration:

```sql
- id (uuid, primary key)
- game_id (text, references games.id, unique constraint with is_active)
- daily_room_name (text, unique)
- daily_room_url (text)
- created_at (timestamptz)
- expires_at (timestamptz)
- is_active (boolean, default true)
- max_participants (integer, default 10)
- created_by (uuid, references auth.users)
- updated_at (timestamptz)
```

## Security Model

### Row Level Security (RLS) Policies

**Games Table:**

- ✅ `SELECT`: Anyone can view active games (for joining)
- ✅ `INSERT`: Only authenticated users can create games
- ✅ `UPDATE`: Only game host can update their games
- ✅ `DELETE`: Only game host can delete their games

**Players Table:**

- ✅ `SELECT`: Players can view other players in their games
- ✅ `INSERT`: Authenticated users can join games (own user_id only)
- ✅ `UPDATE`: Players can update own records OR host can update players
- ✅ `DELETE`: Players can remove themselves OR host can remove players

**Game Events Table:**

- ✅ `SELECT`: Players can view events for their games
- ✅ `INSERT`: Only players in the game can log events
- ✅ `UPDATE`: ❌ Disabled (append-only log)
- ✅ `DELETE`: Only game host can delete events

**Rooms Table:**

- ✅ `SELECT`: Players in the game can view room info
- ✅ `INSERT`: Only game host can create rooms
- ✅ `UPDATE`: Only game host can update rooms
- ✅ `DELETE`: Only game host can delete rooms

### Authentication Integration

- Uses `auth.uid()` and `auth.jwt()` for secure user identification
- Supports both authenticated users and anonymous sessions
- Policies enforce game ownership and participation rules

## Performance Optimizations

### Database Indexes

Strategic indexes for frequently queried columns:

```sql
-- Games: host_id, status, created_at, last_activity
-- Players: game_id, user_id, connection_status, last_seen
-- Game Events: game_id, timestamp, event_type, player_id, (game_id + sequence_number)
-- Rooms: game_id, is_active, expires_at, daily_room_name
```

### Utility Functions

- `cleanup_expired_rooms()`: Remove expired Daily.co rooms
- `update_player_last_seen(player_id)`: Update player activity
- `get_active_players(game_id)`: Get online players for a game

## Real-time Features

- **Supabase Realtime**: Enabled on all tables
- **Game State Sync**: Live updates for game progress
- **Player Status**: Real-time online/offline tracking
- **Event Streaming**: Live game event notifications

## Daily.co Integration

### Room Management

- One active room per game (enforced by unique constraint)
- Automatic room cleanup via `cleanup_expired_rooms()`
- Host-controlled room creation and management
- URL generation for seamless video integration

### Session Tracking

- `last_seen` timestamp for player activity
- `connection_status` for real-time presence
- `session_id` for multiple device support

## Migration History

### 2025-01-23: Security and Performance Overhaul

**Migration**: `20250123000000_improve_database_security_and_performance.sql`

**Completed Improvements:**

- ✅ **Rooms Table**: Created for Daily.co integration with proper foreign keys
- ✅ **Secure RLS Policies**: Replaced permissive "Anyone can..." with authentication-based security
- ✅ **Performance Indexes**: Added strategic indexes for frequently queried columns
- ✅ **Enhanced Game Events**: Added player attribution, sequencing, and metadata
- ✅ **Session Tracking**: Improved player online/offline status management
- ✅ **Utility Functions**: Added helper functions for common operations
- ✅ **Realtime Optimization**: Enabled on all tables for better performance

**Security Improvements:**

- Authentication-based access control using `auth.uid()`
- Granular permissions per table and operation
- Game ownership and participation validation
- Append-only game event logging

**Performance Improvements:**

- Strategic database indexes
- Optimized queries for player status
- Cleanup functions for maintenance
- Enhanced real-time subscriptions

## Development Guidelines

### Database Changes

- All schema changes must go through migrations
- Use `pnpm` commands for all Supabase operations
- Test migrations on development before production
- Document all changes in this file

### Security Best Practices

- Always use RLS policies for data access
- Validate user permissions at database level
- Use `auth.uid()` for user identification
- Implement proper foreign key constraints

### Performance Guidelines

- Add indexes for frequently queried columns
- Use utility functions for complex queries
- Monitor query performance in Supabase dashboard
- Clean up expired data regularly

## Status: ✅ COMPLETED

All TODOs have been successfully implemented:

- ✅ Created and implemented Rooms table for Daily room information
- ✅ Improved policies and Supabase settings with secure RLS
- ✅ Enhanced game event logging with attribution and metadata
- ✅ Optimized player session tracking with real-time status
- ✅ Added comprehensive game state management

The database is now secure, performant, and ready for production use.
