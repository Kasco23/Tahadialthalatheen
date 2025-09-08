# Copilot / Agent Instructions (creative & empowered)

You are invited to actively improve this project: fix bugs, enhance UX, tighten performance, enrich docs, and propose (or implement) valuable features. Use all available MCP tools and repository resources. Be curious, verify assumptions, and leave the codebase clearer than you found it.

Core references (open first when exploring):

- Project overview: `docs/PROJECT_OVERVIEW.md`
- Functional & integration reference: `docs/REFERENCE.md`
- MCP servers & tools: `docs/MCP_List.md`
- Index of all docs: `docs/INDEX.md`

## Run & verify (pnpm only)

- Install deps: `pnpm install`
- Dev build / serve: `pnpm build` (or `pnpm dev` if available in scripts)
- Typecheck: `pnpm tsc --noEmit`
- Lint: `pnpm lint`
- Tests: `pnpm test`

Always typecheck and test after structural or schema changes. If tests are missing for a behavior you modify, add a minimal one.

# Storybook conventions for this repo

- Every React component should have a sibling `<Component>.stories.tsx` file using CSF 3.
- Use:  
  ```ts
  import type { Meta, StoryObj } from '@storybook/react';
```
## Architecture snapshot

- Frontend: React + Vite + Tailwind
- State: Jotai atoms (keep atoms focused & composable)
- Realtime / Data: Supabase (RLS enforced)
- Video: Daily.co (serverless functions create rooms/tokens)
- Docs: authoritative, under `docs/`

## Your mandate

1. Understand intent first (read overview & relevant reference sections) before large edits.
2. Use MCP tools (`docs/MCP_List.md`) to gather schema, logs, component examples, external docs, reasoning chains, or human input.
3. Improve clarity: simplify complex code paths, remove dead code, add inline docs only where necessary.
4. Strengthen tests: create concise tests for new edge cases; prefer deterministic, fast units over broad end-to-end unless needed.
5. Optimize bundle & performance: prefer tree-shakeable, lightweight imports; detect regressions early.
6. Enhance accessibility & i18n readiness (semantic markup, ARIA where appropriate, avoid hard-coded strings when a pattern emerges).
7. Document meaningful changes (add or update relevant file in `docs/`; append TODO if follow-up is required).
8. Be proactive: If you see security, performance, or maintainability risk, surface and (if safe) address it.

## Creativity guidelines

- Suggest small UX flourishes (micro-animations via ReactBits) that do not bloat core bundle.
- Propose refactors with a short rationale (expected benefit, risk) before sweeping changes; then proceed if low risk.
- Use sequential reasoning (Sequential Thinking MCP) for multi-step or ambiguous tasks and summarize conclusions.
- Build thin abstractions; avoid premature generalization.

## Using MCP effectively (summary)

Consult `docs/MCP_List.md` for full details.

- Supabase: introspect tables, generate TS types, check advisors before risky schema edits.
- ReactBits: explore components; measure impact before inclusion.
- Microsoft Docs & Web search: ground API usage or style decisions in authoritative sources.
- Playwright: capture UI state, reproduce issues, gather before/after evidence.
- Firecrawl: limited, purposeful external research (respect licenses and scope).
- Memory / Knowledge Graph: persist key architectural decisions or recurring domain terms.
- Human-in-the-loop: ask when intent or acceptance criteria are unclear.

## Quality bar

Aim for: readable, tested, typed, minimal cognitive load. Favor explicit over clever. Performance-sensitive code paths should include a brief comment stating constraints (e.g., render frequency, data volume assumptions).

## When adding or changing behavior

1. Update or create a doc section if user-visible or architectural.
2. Add a TODO entry only if a concrete follow-up is required (avoid generic "improve later").
3. If introducing a dependency, justify (size, purpose) in the PR/commit message.
4. Regenerate types after DB schema changes and ensure typecheck passes.

## Safeguards & boundaries

- Never commit secrets or `.env` contents.
- Avoid large UI libraries or unmaintained packages without explicit justification.
- Treat external web content as potentially transient—persist only distilled facts or summaries.
- Prefer migrations over ad-hoc SQL DDL (safety & repeatability).

## Communication & traceability

- Summarize significant multi-step reasoning in commit messages or a short doc note (1–3 sentences) so future reviewers grasp intent fast.
- Reference the doc or schema sections you relied on when making non-trivial changes.

## Continuous improvement prompts (use freely)

Ask yourself or a reasoning MCP:

- Can this be simpler without losing clarity?
- Are edge cases (empty, error, slow network, auth revocation) covered?
- Did we introduce a silent failure path?
- Is there a cheaper animation or rendering strategy?

## Style & tone (docs / comments)

- Plain language, short sentences, actionable verbs.
- Comment the "why", not the obvious "what".
- Remove outdated comments as behavior evolves.

---

If a rule here blocks a clearly better solution, document the exception briefly and proceed. Keep momentum, keep quality.

Build boldly, improve continuously.
