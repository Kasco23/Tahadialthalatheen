# Reference

This document serves as a comprehensive reference for key components, integrations, and project-specific guidelines in the Thirty Challenge project.

## Daily.co Integration

### Overview

Daily.co provides video room functionality with server-side token management for security.

### Key Netlify Functions

- `create-daily-room.ts` — POST to create a room
- `create-daily-token.ts` — POST to create meeting tokens
- `delete-daily-room.ts` — POST to delete a room

### Client-Side Implementation

- Uses lazy-loaded Daily SDK
- Manages call object via Jotai atoms (`src/state/videoAtoms.ts`)
- Host PC is source-of-truth for room creation
- Tokens must be generated server-side for security

## Quiz Structure

### Inspiration

Based on "تحدي الثلاثين" Season 2 structure and rules, hosted on YouTube channel: https://www.youtube.com/@MUSAEDALFOUZAN

### Segments (Run in Order)

1. **{ماذا تعرف}** (WSHA) - "What do you know"
2. **{المزاد}** (AUCT) - "Auction"
3. **{فقرة الجرس}** (BELL) - "Bell Section"
4. **{سين & جيم}** (SING) - "Q & A"
5. **{التعويض}** (REMO) - "Compensation"

### Global Scoring Rules

- Correct answer → +1 point
- "Clean exit" (no Strike during question) → +2 bonus points
- Repeating answer or interrupting opponent = 1 Strike
- Three Strikes in same question OR failing segment quota → point goes to opponent

### Segment-Specific Mechanics

#### WSHA (What You Know)

- Alternating list: Player A, Player B until 3 total Strikes
- Each wrong/repeated item = 1 Strike to player
- Clean question survival = +2 bonus

#### AUCT (Auction)

- Players bid item count they can name
- Highest bidder answers alone
- Must deliver ≥50% of promised count
- Meeting quota: +1 per correct item
- <50% delivery: -1 to bidder, +1 to opponent
- 40 points unlocks one-time LOCK_BUTTON for exclusive questions

#### BELL (Bell Section)

- Fast-buzzer questions, first to buzz answers
- Each player has one TRAVELER_BUTTON for exclusive questions
- Wrong exclusive answer gives point to opponent automatically
- No Strikes - one wrong ends question

#### SING (Q & A)

- Four tough trivia questions by default
- Each player owns one PIT_BUTTON
- Correct PIT answer: +2 to you, -2 to opponent
- Wrong PIT answer: no score change, button lost

#### REMO (Compensation)

- Late comeback opportunity
- "Guess the career" style clues
- First correct guess gets point
- Wrong guesses delay next clue (no Strikes)

## Theme Configuration

### Theme System Overview

Themes use CSS custom properties (variables) defined on theme classes applied to the `html` element.

### Key CSS Variables

- `--theme-primary`
- `--theme-secondary`
- `--theme-accent`
- `--theme-background`
- `--theme-surface`

### Theme Implementation

1. **CSS Definition**: Add theme blocks in `src/index.css`
2. **State Management**: Update presets in `src/state/themeAtoms.ts`
3. **UI Integration**: Expose in ThemeConfigurator component

### Persistence Options

- **Local**: Use `atomWithStorage` or `useEffect` with `localStorage`
- **Remote**: Sync to Supabase user metadata

## Questions Management

Questions are managed in `src/data/questions.ts` with customizable segment names and question amounts.

## Testing Guidelines

- Ensure all integrations are tested using `pnpm test`
- Add unit tests for ThemeConfigurator functionality
- Verify theme class changes on `html` element
- Test `customColorsAtom` updates with color pickers

## Bundle Considerations

- Keep theme assets small to respect bundle size limits
- Avoid large imagery in themes
- Register new theme documentation in `docs/DocsGuide.md`
