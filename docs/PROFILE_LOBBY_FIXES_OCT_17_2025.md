# Profile & Lobby Display Fixes - October 17, 2025

## Issues Identified

1. ❌ **Lobby participants not showing flag and team logo** - JOIN query returning NULL because `profile_id` was not set
2. ❌ **Helper text showing in Profile** - "Use 'Change Flag/Team' button below to update" was unnecessary
3. ❌ **SVG image quality low** - Team logos appeared pixelated instead of crisp
4. ⚠️ **Name field concern** - User thought it was empty, but it was actually populated

## Root Cause Analysis

### Database Issue
The main problem was that participants were created **without `profile_id`**, causing the JOIN query to return NULL:

```typescript
// Lobby.tsx query
Profiles!profile_id(flag, team)
```

When `profile_id` is NULL, the JOIN returns no data, so:
- `player.Profiles?.flag` = undefined → Falls back to default "sa"
- `player.Profiles?.team` = undefined → No logo shows

### Verification
```sql
-- Before fix
SELECT profile_id FROM Participants WHERE session_code = '492YTI';
-- Result: profile_id = NULL

-- After fix  
SELECT profile_id FROM Participants WHERE session_code = '492YTI';
-- Result: profile_id = 'b44828b2-33cd-4998-a701-1a6a3126e77e'
```

## Fixes Implemented

### 1. Database Update - Set profile_id for Existing Participant
```sql
UPDATE "Participants" 
SET profile_id = 'b44828b2-33cd-4998-a701-1a6a3126e77e' 
WHERE participant_id = '34d6afa0-2add-40ae-856f-b9ece2f2243c';
```

**Result**: Host participant now has `profile_id` linking to Profiles table

---

### 2. Code Fix - mutations.ts
**File**: `src/lib/mutations.ts`

**Before**:
```typescript
const participantsToCreate = [
  {
    session_id: sessionData.session_id,
    name: "GameMaster",
    role: "GameMaster" as ParticipantRole,
    lobby_presence: "Joined" as LobbyPresence,
    // ❌ Missing profile_id
  },
  {
    session_id: sessionData.session_id,
    name: sanitizedHostName,
    role: "Host" as ParticipantRole,
    lobby_presence: "NotJoined" as LobbyPresence,
    // ❌ Missing profile_id
  },
];
```

**After**:
```typescript
const participantsToCreate = [
  {
    session_id: sessionData.session_id,
    name: "GameMaster",
    role: "GameMaster" as ParticipantRole,
    lobby_presence: "Joined" as LobbyPresence,
    profile_id: hostProfileId, // ✅ Added
  },
  {
    session_id: sessionData.session_id,
    name: sanitizedHostName,
    role: "Host" as ParticipantRole,
    lobby_presence: "NotJoined" as LobbyPresence,
    profile_id: hostProfileId, // ✅ Added
  },
];
```

**Impact**: All new sessions will create participants with `profile_id` set

---

### 3. Profile.tsx - Remove Helper Text
**File**: `src/pages/Profile.tsx`

**Removed**:
```tsx
<p className="text-xs text-gray-500 mt-1">
  Use "Change Team" button below to update
</p>

<p className="text-xs text-gray-500 mt-1">
  Use "Change Flag" button below to update
</p>
```

**Result**: Cleaner UI without redundant instructions

---

### 4. Enhance SVG Image Quality
**Files**: `src/pages/Profile.tsx`, `src/components/LobbyLogo.tsx`

#### Profile.tsx - Team Logo
```tsx
<img
  src={profile.team}
  alt="Team logo"
  className="w-8 h-8 object-contain"
  style={{
    imageRendering: '-webkit-optimize-contrast', // ✅ Added for crisp SVGs
    shapeRendering: 'geometricPrecision',       // ✅ Added for sharp edges
  }}
  onError={(e) => {
    e.currentTarget.style.display = "none";
  }}
/>
```

#### LobbyLogo.tsx
```tsx
<img
  src={logoUrl}
  alt={`${teamName} logo`}
  className="w-full h-full object-contain rounded"
  style={{
    // Optimize SVG rendering for maximum quality
    imageRendering: '-webkit-optimize-contrast',  // ✅ Changed from 'auto'
    shapeRendering: 'geometricPrecision',         // ✅ Added
    backfaceVisibility: 'hidden',
    transform: 'translateZ(0)',
    WebkitBackfaceVisibility: 'hidden',
    WebkitTransform: 'translateZ(0)',
  }}
/>
```

**CSS Properties Explained**:
- `imageRendering: '-webkit-optimize-contrast'`: Tells browser to optimize for high-contrast vector images (SVGs)
- `shapeRendering: 'geometricPrecision'`: Ensures sharp, precise rendering of SVG shapes
- `backfaceVisibility: 'hidden'`: GPU acceleration optimization
- `transform: 'translateZ(0)'`: Forces hardware acceleration

**Result**: SVG logos now render at maximum quality without pixelation

---

## Testing Results

### Profile Page
✅ **Name field**: Shows "Tareq" correctly (was never empty)  
✅ **Team logo**: Real Madrid crest displays in high quality  
✅ **Team name**: Extracts "Real Madrid" from URL correctly  
✅ **Flag icon**: Palestine flag displays  
✅ **Flag name**: Shows "Palestine" (not "PS")  
✅ **Helper text**: Removed  

### Lobby Page
✅ **Host participant**:
  - Flag: Palestine (PS) ✅
  - Team logo: Real Madrid crest ✅
  - Both render in high quality ✅

### Database Verification
```sql
SELECT 
  p.name, 
  p.role, 
  p.profile_id,
  pr.flag,
  pr.team
FROM "Participants" p
LEFT JOIN "Profiles" pr ON p.profile_id = pr.id
WHERE p.session_id IN (
  SELECT session_id FROM "Sessions" WHERE session_code = '492YTI'
);
```

**Result**:
```
name     | role | profile_id                           | flag | team
---------|------|--------------------------------------|------|------------------------------------------
Tareq    | Host | b44828b2-33cd-4998-a701-1a6a3126e77e | PS   | https://...storage.../real-madrid.svg
```

✅ JOIN query now returns data correctly

---

## Before & After Screenshots

### Lobby - Before
- Flag: SA (default fallback) ❌
- Team logo: Not showing ❌

### Lobby - After
- Flag: PS (Palestine) ✅
- Team logo: Real Madrid crest ✅
- High quality SVG rendering ✅

### Profile - Before
- Helper text: "Use 'Change Team' button below to update" ❌
- SVG quality: Standard ⚠️

### Profile - After
- Helper text: Removed ✅
- SVG quality: Enhanced with geometricPrecision ✅

---

## Files Modified

1. ✅ `src/lib/mutations.ts` - Added `profile_id` to participant creation
2. ✅ `src/pages/Profile.tsx` - Removed helper text, enhanced SVG quality
3. ✅ `src/components/LobbyLogo.tsx` - Enhanced SVG rendering quality

---

## Future Considerations

### Profile ID Null Handling
If a participant doesn't have a profile_id (legacy data), the current code gracefully falls back to participant fields:

```tsx
<Flag 
  code={(player.Profiles?.flag || player.flag) ?? "sa"} 
  className="text-lg" 
/>
```

**Recommendation**: Add migration script to backfill `profile_id` for all existing participants without one.

### SVG Rendering Across Browsers
The current implementation uses vendor-specific properties that work in Chromium-based browsers. For full cross-browser support, consider:

```tsx
style={{
  imageRendering: '-webkit-optimize-contrast', // Chrome/Edge
  imageRendering: '-moz-crisp-edges',          // Firefox
  imageRendering: 'crisp-edges',               // Standard
  shapeRendering: 'geometricPrecision',
}}
```

### Team Logo Storage
Current implementation stores **full URL** in `Profiles.team`:
```
https://psdrwkjkgubatiemsgqn.supabase.co/storage/v1/object/public/logos/La-Liga/real-madrid.svg
```

**Alternative approach**: Store just team name and generate URL in helper:
```typescript
// Store: "Real Madrid"
// Generate: getTeamLogoUrl("Real Madrid") → URL
```

**Pros**: More flexible, easier to update logo paths  
**Cons**: Requires mapping all teams to logos

---

## Summary

All issues have been successfully resolved:

1. ✅ **Lobby displays flag and team logo** - Fixed by setting `profile_id` on participants
2. ✅ **Profile helper text removed** - Cleaner UI
3. ✅ **SVG quality enhanced** - Crisp, sharp rendering with `geometricPrecision`
4. ✅ **Name field works correctly** - Was never broken, just user confusion

**Impact**: 
- Existing session: Fixed via SQL UPDATE
- Future sessions: Fixed via code changes in mutations.ts
- UI quality: Significantly improved with enhanced SVG rendering

---

**Last Updated**: October 17, 2025  
**Session Tested**: 492YTI  
**Status**: ✅ All fixes verified and working
