# MCP Servers & Tools Reference

This file enumerates the Model Context Protocol (MCP) servers and their exposed tools currently used with this repository. Update this file whenever a new MCP server or tool becomes available (or is removed). If you see a tool in the tool list that is missing here, append a new section with a short description and practical usage ideas.

Source of truth for active servers: local `mcp.json` (editor profile) and CI setup workflow (`.github/workflows/copilot-setup-steps.yml`).

## Quick Editing Rules
1. Keep each server section short (purpose + key tools + sample use cases).
2. Prefer imperative verbs ("List tables", "Fetch docs").
3. When adding a new server, also link it from `docs/INDEX.md` if broadly useful.

---

## Supabase Server (`@supabase/mcp-server-supabase`)
Purpose: Introspect and manage the database schema, migrations, and edge functions.

Key tools:
- list_tables: enumerate tables (confirm schema + RLS state).
- list_migrations / apply_migration / reset_branch / merge_branch: migration lifecycle.
- execute_sql: run targeted SQL (avoid DDL; prefer migrations).
- generate_typescript_types: sync DB types to client code.
- get_logs: recent service logs (api, auth, postgres, realtime, storage).
- get_advisors: security & performance advisories.

Use cases:
- Validate schema before writing data code.
- Generate fresh TS types after adding columns.
- Check for missing RLS policies (security advisor).

## ReactBits Server (`reactbits-dev-mcp-server`)
Purpose: Discover and import high-quality animation / UI components.

Key tools:
- list_components / search_components / list_categories.
- get_component: fetch component source (Tailwind + TS).
- get_component_demo: usage pattern + example markup.

Use cases:
- Prototype interactive UI quickly (cursor effects, transitions).
- Compare component dependencies (avoid heavy bundles).

## Microsoft Docs Server (`https://learn.microsoft.com/api/mcp`)
Purpose: Search & fetch authoritative Microsoft / Azure / .NET / VS Code documentation.

Key tools:
- microsoft_docs_search: targeted search returning curated chunks.
- microsoft_docs_fetch: fetch full article markdown once a URL is known.

Use cases:
- Ground framework or API guidance (auth flows, accessibility, style guidance).
- Enrich documentation PRs with accurate references.

## GitHub Copilot / General (Remote MCP)
Purpose: Internal Copilot coordination endpoints (not usually invoked directly here). Document only if exposing new utilities.

## Playwright MCP (`@playwright/mcp`)
Purpose: Browser automation & interactive UI exploration.

Key tools (selection):
- browser_navigate / click / type / wait_for / take_screenshot / snapshot / network_requests.

Use cases:
- Reproduce reported UI bug flows.
- Capture DOM snapshot pre/post state change.
- Generate minimal repro scripts for flakey interactions.

## Firecrawl MCP (`firecrawl-mcp`)
Purpose: Web content discovery and extraction at scale.

Key tools:
- search: broad web search when unknown source.
- scrape: fetch single URL content (fast path).
- crawl / map: multi-page or site structure exploration.
- extract: structured JSON extraction with custom prompt + schema.

Use cases:
- Competitive feature scan (public pages only).
- Pull external data samples for test fixtures (ensure license suitability first).
- Summarize docs for architectural decision records.

## ImageSorcery MCP (`imagesorcery-mcp`)
Purpose: Image transformation & basic processing (optimize, resize, format conversion). (Add concrete tool names upon first invocation.)

Use cases:
- Optimize new asset before committing.
- Generate low-quality placeholder (LQIP) variants.

## Human-In-The-Loop MCP (`hitl-mcp-server`)
Purpose: Ask the human for clarification (multiline input, choices, confirmation dialogs) during ambiguous tasks.

Key tools:
- get_user_input / get_multiline_input / get_user_choice / show_confirmation_dialog / show_info_message.

Use cases:
- Confirm destructive migration actions.
- Disambiguate design preference (color palettes, naming).

## Sequential Thinking MCP
Purpose: Structured, iterative reasoning with revision tracking.

Key tool:
- sequentialthinking: multi-step thought chain with ability to revise earlier steps.

Use cases:
- Plan refactors; enumerate edge cases before implementation.
- Validate hypothesis (e.g., performance bottleneck root cause).

## Memory / Knowledge Graph MCP
Purpose: Persist and query structured observations (entities / relations) across sessions.

Key tools:
- memory_create_entities / add_observations / create_relations.
- memory_search_nodes / open_nodes / read_graph.

Use cases:
- Track evolving architectural decisions.
- Build a living map of feature dependencies or debt items.

## VS Code API Lookup
Purpose: Retrieve VS Code extension API references (when authoring or adjusting tooling scripts / recommendations).

Key tool:
- get_vscode_api: search for API usage patterns & capabilities.

Use cases:
- Suggest editor integration improvements or tasks automation.

## General Guidelines for Using MCP Tools
1. Prefer read-only introspection first; gather context before mutating state.
2. For DB schema changes, stage a migration (apply_migration) instead of ad-hoc SQL DDL.
3. After generating types (Supabase), ensure TypeScript passes (`pnpm tsc --noEmit`).
4. Avoid over-crawling external sites (set reasonable limits; respect robots and ToS).
5. Capture just enough evidence (logs, schemas, snapshots) to justify a change; embed summaries, not raw bulk output, in commit messages or docs.

## Adding a New MCP Server
1. Install / configure in `mcp.json` locally and CI workflow if needed.
2. Append a new section here (Purpose, key tools, use cases).
3. Link it in `docs/INDEX.md` if broadly valuable.
4. Reference it from any new guidance docs that depend on it.

---

Last updated: (add date when significant changes are made)
