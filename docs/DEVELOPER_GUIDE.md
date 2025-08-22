# Developer Guide

This guide consolidates essential information for developers working on the Thirty Challenge project.

## Project Overview

Refer to `PROJECT_OVERVIEW.md` for a high-level understanding of the project goals and architecture.

## Development Environment Setup

### Prerequisites

- **Google Chrome** (Primary development browser) - Latest version recommended
- **Node.js** 18+
- **pnpm** (Package manager - project uses pnpm workspace)
- **Git**

### Quick Start

1. **Clone and Install**

   ```bash
   git clone <repository-url>
   cd thirty-challenge-code
   pnpm install
   ```

2. **Environment Variables Setup**
   Create a `.env.local` file in the project root (this file is gitignored):

   ```bash
   # PUBLIC (VITE_ prefix - sent to browser)
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   VITE_DAILY_DOMAIN=your-team.daily.co

   # PRIVATE (server-side only)
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   DAILY_API_KEY=your_daily_api_key_here
   ```

3. **Development Modes**

   ```bash
   # Frontend only (Vite dev server on :5173)
   pnpm dev

   # Full stack with Netlify functions (:3000)
   pnpm dev:netlify

   # Production preview
   pnpm preview
   ```

## Coding Standards

### React Configuration

- Use React 19 with functional components and hooks only
- Follow the ReactDOM.createRoot pattern for initialization
- Use TypeScript for all components with proper typing

### Code Quality

- Use `pnpm lint` to ensure code quality
- Format code with `pnpm format`
- Run `pnpm tsc --noEmit` for type checking
- Test with `pnpm test` before committing

### Architecture Patterns

- **State Management**: Use Jotai atoms in `src/state/` (small, single-responsibility)
- **Components**: Place UI components in `src/components/`
- **Segments**: Segment-specific logic lives in `src/segments/`
- **API Integration**: Use `src/api/` for Supabase/Daily integration helpers

## VSCode Configuration

### Recommended Extensions

Extensions are listed in `.vscode/extensions.json`. Key recommendations:

- TypeScript and JavaScript Language Features
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Auto Rename Tag

### Debugging Setup

For Chrome debugging:

1. Launch Chrome with debugging enabled:

   ```bash
   google-chrome --remote-debugging-port=9222 --disable-web-security --user-data-dir=/tmp/chrome-debug http://localhost:5173
   ```

2. Use VSCode debugging configurations in `.vscode/launch.json`

3. For Netlify functions debugging, use Node.js debugging patterns

### Copilot Usage Tips

- Follow `docs/AGENTS.md` for automated agent guidelines
- Use descriptive commit messages and PR descriptions
- Prefer feature branches (e.g., `feature/<name>`)

## Documentation Guidelines

### Documentation Rules for Agents

- All new documentation must be created under the `docs/` directory
- Update `docs/DocsGuide.md` when adding new documentation
- Update `docs/TODOs.md` to reflect changes in scope
- Log significant changes in `docs/CHANGELOG.md` following Keep a Changelog format

### Change Tracking

- Update `CHANGELOG.md` for every significant change
- Follow the workflows outlined in `WORKFLOWS.md` for CI/CD and branching strategies
- Use proper Markdown formatting and lint rules

## Bundle Management

- Keep new imports <10 kB min+gzip where possible
- Hard JS bundle limit: <200 kB
- Run `pnpm dep:graph` after structural changes to avoid dependency cycles
- Check `full-dependency-map.json` for cycle validation
