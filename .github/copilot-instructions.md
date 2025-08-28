# Copilot Instructions for Thirty Quiz

This document contains key instructions for GitHub Copilot and other AI coding agents when working with this project.

## MCP Server IntegrationInstructions for Thirty C## Pull Request Checklist

1. Code compiles (`pnpm tsc --noEmit`)
2. ESLint passes (`pnpm lint`)
3. Vitest passes (`pnpm test`)
4. Bundle size guard (<200 kB JS)
5. Regenerate dependency map if structure changes (`pnpm dep:graph`)
6. Update relevant documentation in `docs/` when behavior changes

## MCP Server Integration

This repository is configured to work with Model Context Protocol (MCP) servers for enhanced development capabilities:

### Supported MCP Servers

- **Context7**: Library documentation and code examples
- **Sequential Thinking**: Advanced problem-solving and planning
- **Memory**: Knowledge graph for project context
- **Playwright**: Web automation and testing
- **Firecrawl**: Web scraping and content extraction
- **ImageSorcery**: Image processing and manipulation

### Usage in GitHub Copilot Web

The repository includes MCP server configurations for GitHub Copilot coding agent. When working with issues assigned to Copilot, these tools will be automatically available for autonomous use.

### Local Development

For local VS Code development, MCP servers are configured in the user's `mcp.json` file with input prompts for secure credential management.

## Purpose & Scope

- Purpose: Real-time, club-themed football quiz web app (canonical details in `docs/PROJECT_OVERVIEW.md`).
- This file defines how automated agents (Copilot, CI bots) should interact with the repo, what workflows to follow, and where generated documentation must live.

## Essential Tooling & Package Manager

- Package manager: pnpm is the only supported package manager for installs, scripts, and CI. Do not use `npm` or `yarn` for repo changes or documentation examples; use `pnpm` commands (for example `pnpm install`, `pnpm build`, `pnpm test`).

## Stack

- React 19, Vite 7, Tailwind 3.4, Supabase JS 2.19, Daily JS 0.56, Framer Motion 12.

## Architecture & Key Patterns

- UI: React function components + hooks only. No class components. Tailwind utility classes preferred.
- State: Jotai atoms in `src/state/` (small, single-responsibility). No Redux/MobX.
- Segments: Segment-specific logic lives in `src/segments/` (BELL, SING, REMO, ...). Use hooks for segment logic.
- Realtime: Supabase channels for game-state sync; Daily.co for video. See `src/api/` for integration.
- Env Vars: All secrets/config live in `.env` (see `docs/.env.example`). Never commit secrets. Throw runtime errors if required env vars are missing.
- Bundle: Keep new imports <10 kB min+gzip where possible. Hard JS bundle limit: <200 kB.
- Dependency Map: Avoid cycles. If you change module structure, run `pnpm dep:graph` and validate `full-dependency-map.json`.

## Developer Workflows (use pnpm)

- Build: `pnpm build` (Vite)
- Typecheck: `pnpm tsc --noEmit`
- Lint: `pnpm lint`
- Test: `pnpm test` (Vitest)
- Dependency map: `pnpm dep:graph`
- Flowchart update: `pnpm flow:update` (writes `docs/current-flow.mmd`)
- Netlify: Deploys on push to `main`. Check Netlify logs and env vars if previews fail.

## Pull Request Checklist

1. Code compiles (`pnpm tsc --noEmit`)
2. ESLint passes (`pnpm lint`)
3. Vitest passes (`pnpm test`)
4. Bundle size guard (<200 kB JS)
5. Regenerate dependency map if structure changes (`pnpm dep:graph`)
6. Update `docs/REFERENCE.md` and `docs/TODOs.md` when behavior or docs change

## Refactor Workflow (for AI Agents)

1. Open issue tagged `needs-gpt` with intent and flowchart reference in `docs/current-flow.mmd`.
2. Wait for human approval.
3. Branch: `gpt/<short-desc>`.
4. Run `pnpm dep:graph` & `pnpm flow:update`.
5. Open Draft PR with a small bundle report and the `docs/` changes.
6. On approval, squash-merge; Netlify preview must pass CI checks.

## Documentation rules for automated agents (important)

- All new or updated documentation files must be created or updated under the `docs/` directory.
- Whenever an automated agent (Copilot) adds documentation, notes, or design artifacts, it must:
  - Add/merge the file into `docs/`.
  - Register the file and its purpose in `docs/INDEX.md` (comprehensive documentation index).
  - Update `docs/TODOs.md` to reflect how the new doc affects scope and outstanding work.
  - Log significant changes in `docs/CHANGELOG.md` following the Keep a Changelog format.
  - When modifying or superseding prior docs, the agent should mark old lines as struck-through using Markdown strikethrough (~~) and append a short rationale and timestamp.

## Changelog and Version History

- Use `docs/CHANGELOG.md` as the primary change history following [Keep a Changelog](https://keepachangelog.com/) format.
- All automated agents must log significant changes (features, fixes, breaking changes) with proper categorization.
- Include relevant commit references and issue numbers when applicable.
- The changelog consolidates information from legacy summary files and serves as the single source of truth for project evolution.

## Hard NOs

- No Redux/MobX. No UI kits >30 kB.
- No beta/next packages unless explicitly approved in an issue.
- Never commit `.env` or secrets.

## Key Files & Directories

- `src/` – app source code
- `src/segments/` – segment logic
- `src/api/` – Supabase/Daily integration
- `docs/` – canonical documentation (see REFERENCE.md for file overview)
- `full-dependency-map.json` – check for cycles
- `docs/current-flow.mmd` – process/flowchart
- `docs/PROJECT_OVERVIEW.md` – product overview

## When making code or doc changes (agent rules)

- If you add or change behavior, update `docs/TODOs.md` and `docs/REFERENCE.md` as part of the same change.
- Use `pnpm` in all example commands inside docs.
- Keep changes small and reversible; prefer feature branches `gpt/<desc>` for multi-file changes.

---

For details and examples, see `docs/AGENTS.md` and `docs/PROJECT_OVERVIEW.md`. When in doubt, prefer explicit, minimal, and type-safe code. Ask for human review before major refactors.
