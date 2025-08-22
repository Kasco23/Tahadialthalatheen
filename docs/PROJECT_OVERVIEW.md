# Thirty Challenge – Green‑Field Repo Overview

This file contains the canonical project description, MVP, tech choices and approved changes.

## Purpose

Help build and iterate on a replayable, club‑themed football quiz web app using React, Vite, Tailwind and Supabase realtime.

## MVP Definition

- Lobby: Create/join game (Host, 2 players)
- Quiz Flow: Sequential segments with host-controlled "Next"
- Basic Scoring: Points tally and winner banner
- Visuals: Two player panels + host panel
- Tech: Works as static site, bundle <200 kB JS
- Questions language: Arabic

## Chosen Tech Stack

- React 19 + Vite 7
- Tailwind 3.4
- Framer Motion 12
- Supabase (realtime)
- daily.co for video
- Vitest for tests

## Repo Skeleton (high level)

- `src/` – main app code (components, pages, segments, hooks)
- `netlify/functions/` – serverless functions for Daily.co and backend tasks
- `public/` – static assets
- `docs/` – consolidated documentation (moved here)

## Deployment & CI

- Hosted on Netlify: https://quiz.tyshub.xyz
- Maintain full-dependency-map.json (madge)
- PR checklist and bundle guard enforced in docs/AGENTS.md

## Approved Changes

- Dual host control modes
- Segment specific behaviors (BELL, SING, REMO)
- Centralized video room creation in Lobby

(For full historical details refer to the original top-level file in git history.)
