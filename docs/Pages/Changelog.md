# Pages - Changelog

**Category**: User-facing route components  
**Tracking Start**: October 17, 2025

---

## October 21, 2025

### Documentation Created
- ✅ Created comprehensive Pages documentation structure
- ✅ Documented all 13 active pages with detailed specs
- ✅ Established changelog tracking system

---

## October 17, 2025

### Major Updates

#### Profile.tsx - Enhanced with Tabs
- **Change**: Added three-tab interface (Profile, Statistics, Friends)
- **Reason**: Better organization of profile features
- **Components**: Integrated StatisticsTab and FriendsTab components
- **Impact**: Improved UX, better information hierarchy

#### Inbox.tsx - Created
- **Change**: New notification center page
- **Route**: `/inbox`
- **Features**: Real-time notifications, mark read/unread, filters
- **Dependencies**: Supabase subscriptions, notifications library
- **Impact**: Users can now manage in-app notifications

#### Leaderboard.tsx - Created
- **Change**: New rankings and statistics page
- **Route**: `/leaderboard`
- **Features**: Two tabs (Top Players, Epic Matches), medals, rankings
- **Dependencies**: Supabase views (top_players, epic_matches)
- **Impact**: Competitive element, user engagement

#### Homepage.tsx - Navigation Enhancements
- **Change**: Added NotificationBell component to header
- **Change**: Enhanced profile menu with Inbox and Leaderboard links
- **Features**: Real-time unread count, one-click navigation
- **Impact**: Better discoverability of new features

#### FlagSelection.tsx & TeamSelection.tsx - Restored
- **Change**: Moved back from deprecated/ to active pages/
- **Reason**: Profile.tsx needs these for "Change Flag" and "Change Team" buttons
- **Routes**: `/select-flag` and `/select-team` re-enabled
- **Impact**: User customization flow restored

### Deprecations

#### Join.tsx (Original)
- **Change**: Deprecated and moved to `/src/deprecated/`
- **Reason**: Replaced by JoinSimplified.tsx
- **Route**: Removed from App.tsx routing
- **Impact**: Cleaner codebase, better UX

---

## Pre-October 2025

### Initial Development
All core pages created during initial application development:
- Homepage.tsx
- Signup.tsx / Login.tsx
- JoinSimplified.tsx
- GameSetup.tsx
- Lobby.tsx
- Quiz.tsx
- Results.tsx
- Profile.tsx
- FlagSelection.tsx
- TeamSelection.tsx

---

## Upcoming Changes

### Planned
- None currently planned

### Under Consideration
- Potential Results.tsx enhancement with detailed question review
- Quiz.tsx improvements for better mobile experience
- Lobby.tsx enhancements for better video layout

---

## Change Log Format

Each entry should include:
- **Date**: When the change occurred
- **Page(s)**: Which file(s) were modified
- **Type**: Created | Updated | Deprecated | Removed
- **Change**: What was changed
- **Reason**: Why the change was made
- **Impact**: Effect on users/app
- **Dependencies**: New libraries or components added

---

## See Also
- **CurrentState.md** - Current page specifications
- **Deprecated.md** - Removed pages
- **Overview.md** - Category introduction
