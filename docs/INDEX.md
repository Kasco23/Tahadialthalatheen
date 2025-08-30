# Documentation Index

Authoritative catalog of project documentation. Update this file whenever adding, removing, or significantly changing docs. Keep entries concise: Purpose, Audience, Contains (key topics), Status (if lifecycle-relevant).

## 📋 Core Documentation

### [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)

**Purpose**: Canonical project description and approved changes
**Audience**: All stakeholders, new developers
**Contains**: MVP definition, tech stack choices, deployment info, approved architectural changes

### [SETUP.md](SETUP.md)

**Purpose**: Local development setup instructions
**Audience**: Developers setting up the project locally
**Contains**: Environment configuration, development server options, dependency installation

### [REFERENCE.md](REFERENCE.md)

**Purpose**: Technical reference for components and integrations
**Audience**: Developers implementing features
**Contains**: Daily.co integration, quiz structure, theme system, testing guidelines

## 🤖 Agent & AI Documentation

### [AGENTS.md](AGENTS.md)

**Purpose**: Instructions for automated agents and AI assistants
**Audience**: GitHub Copilot, CI bots, automated tools
**Contains**: Workflow rules, documentation requirements, change tracking protocols

### [MCP_List.md](MCP_List.md)

**Purpose**: Catalog of available MCP servers & tools
**Audience**: AI agents, developers leveraging tool automation
**Contains**: Server purposes, key tools, usage examples, guidelines

### [GITHUB_COPILOT_MCP_SETUP.md](GITHUB_COPILOT_MCP_SETUP.md)

**Purpose**: Setup guide for MCP servers with GitHub Copilot web
**Audience**: Repository administrators, developers
**Contains**: Configuration conversion, environment secrets, server setup, troubleshooting

## 🔐 Deployment & Production

### [SETUP_PRODUCTION.md](SETUP_PRODUCTION.md)

**Purpose**: Production environment setup and testing instructions
**Audience**: DevOps, deployment engineers
**Contains**: Environment setup, full feature testing, deployment testing, debugging

## 📊 Project Management

### [TODOs.md](TODOs.md)

**Purpose**: Living task list for ongoing work
**Audience**: Developers, project managers
**Contains**: Actionable tasks by category, progress tracking, completion notes

### [CHANGELOG.md](CHANGELOG.md)

**Purpose**: Project change history following Keep a Changelog format
**Audience**: All stakeholders
**Contains**: Chronological changes, version history, migration notes

### [WORKFLOWS.md](WORKFLOWS.md)

**Purpose**: Development and deployment workflow documentation
**Audience**: Developers, DevOps
**Contains**: CI/CD processes, branching strategies, deployment procedures

## 🔧 Technical Implementation

### [USER_FLOW_IMPLEMENTATION.md](USER_FLOW_IMPLEMENTATION.md)

**Purpose**: User flow diagram system implementation details
**Audience**: UX designers, frontend developers
**Contains**: Flow diagram structure, generation scripts, maintenance procedures

### [current-flow.mmd](current-flow.mmd)

**Purpose**: Current process/flowchart in Mermaid format
**Audience**: Developers, technical leads
**Contains**: Auto-generated process diagrams, state flows

### [Supabase_30Aug.md](Supabase_30Aug.md)

**Purpose**: Point-in-time Supabase schema & advisor snapshot (baseline before redesign)
**Audience**: Backend developers, architects
**Contains**: Tables, migrations, extensions, advisor warnings, gaps & next steps

### [SUPABASE_UPGRADE_GUIDE.md](SUPABASE_UPGRADE_GUIDE.md)

**Purpose**: Comprehensive schema upgrade implementation guide
**Audience**: Backend developers, database administrators
**Contains**: Migration scripts, execution order, rollback plans, post-upgrade steps

## 📐 User Flow Diagrams

### [flows/](flows/)

**Purpose**: Directory containing user flow state diagrams
**Audience**: UX designers, frontend developers, stakeholders
**Contains**: DrawIO diagrams for each user role (host, player, controller) showing both frontend interactions and backend state management

#### [flows/README.md](flows/README.md)

**Purpose**: Documentation for the user flow diagram system
**Audience**: Developers working with user flows
**Contains**: Diagram overview, technical implementation, color coding guide

#### Flow Diagram Files:

- `controller-frontend-flow.drawio` - Controller UI interactions
- `controller-backend-flow.drawio` - Controller state management
- `host-frontend-flow.drawio` - Host UI interactions
- `host-backend-flow.drawio` - Host state management
- `player-frontend-flow.drawio` - Player UI interactions
- `player-backend-flow.drawio` - Player state management

---

## Maintenance Instructions

### For Automated Agents

1. Add new doc in correct category.
2. Append entry here (keep ordering & style consistent).
3. Update `TODOs.md` if follow-up work exists.
4. Log notable changes in `CHANGELOG.md` (if user-visible or architectural).

### For Developers

- Prefer enhancing existing docs over duplicating content.
- Keep descriptions succinct; link to more detailed docs instead of repeating.

## 🆕 Newly Detected Docs

### [current-flow.md](current-flow.md)

**Purpose**: _TBD_
**Audience**: _TBD_
**Contains**: _TBD_

**Last Updated**: 2025-08-30 (auto-updated)
