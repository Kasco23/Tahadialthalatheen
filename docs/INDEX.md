# Documentation Index

This file provides a comprehensive overview of all documentation in the `docs/` directory. This index is maintained automatically - agents should update this file when adding, removing, or significantly modifying documentation.

## 📋 Core Documentation

### [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)

**Purpose**: Canonical project description and approved changes
**Audience**: All stakeholders, new developers
**Contains**: MVP definition, tech stack choices, deployment info, approved architectural changes

### [SETUP.md](SETUP.md)

**Purpose**: Local development setup instructions
**Audience**: Developers setting up the project locally
**Contains**: Environment configuration, development server options, dependency installation

### [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)

**Purpose**: Consolidated development practices and standards
**Audience**: Active developers
**Contains**: Coding standards, VSCode configuration, documentation guidelines, bundle management

### [REFERENCE.md](REFERENCE.md)

**Purpose**: Technical reference for components and integrations
**Audience**: Developers implementing features
**Contains**: Daily.co integration, quiz structure, theme system, testing guidelines

## 🤖 Agent & AI Documentation

### [AGENTS.md](AGENTS.md)

**Purpose**: Instructions for automated agents and AI assistants
**Audience**: GitHub Copilot, CI bots, automated tools
**Contains**: Workflow rules, documentation requirements, change tracking protocols

### [GITHUB_COPILOT_MCP_SETUP.md](GITHUB_COPILOT_MCP_SETUP.md)

**Purpose**: GitHub Copilot Web MCP server configuration guide
**Audience**: Developers using GitHub Copilot Web
**Contains**: MCP server setup, tool configurations, usage instructions

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

### [supabase.md](supabase.md)

**Purpose**: Supabase database schema and configuration
**Audience**: Backend developers
**Contains**: Database schema, security model, migration history, integration details

### [SUPABASE_IMPLEMENTATION_SUMMARY.md](SUPABASE_IMPLEMENTATION_SUMMARY.md)

**Purpose**: Summary of major Supabase improvements and changes
**Audience**: Technical leads, backend developers
**Contains**: Security improvements, performance enhancements, implementation approach

### [USER_FLOW_IMPLEMENTATION.md](USER_FLOW_IMPLEMENTATION.md)

**Purpose**: User flow diagram system implementation details
**Audience**: UX designers, frontend developers
**Contains**: Flow diagram structure, generation scripts, maintenance procedures

### [current-flow.mmd](current-flow.mmd)

**Purpose**: Current process/flowchart in Mermaid format
**Audience**: Developers, technical leads
**Contains**: Auto-generated process diagrams, state flows

## 🏗️ Setup & Configuration

### [SETUP_PRODUCTION.md](SETUP_PRODUCTION.md)

**Purpose**: Production environment setup and testing instructions
**Audience**: DevOps, deployment engineers
**Contains**: Environment setup, full feature testing, deployment testing, debugging

## 📈 Monitoring & Observability

### [MONITORING_SETUP.md](MONITORING_SETUP.md)

**Purpose**: Application monitoring and error tracking setup
**Audience**: DevOps, backend developers
**Contains**: Sentry configuration, monitoring tools, observability setup

### [MONITORING_COMPLETE.md](MONITORING_COMPLETE.md)

**Purpose**: Completion summary of monitoring implementation
**Audience**: Technical leads
**Contains**: Implemented monitoring features, tools configured, next steps

### [SENTRY_RUNTIME_TEST.md](SENTRY_RUNTIME_TEST.md)

**Purpose**: Sentry error monitoring testing procedures
**Audience**: QA, backend developers
**Contains**: Runtime testing steps, error simulation, validation procedures

## 🎨 Feature Documentation

### [THEME_ENHANCEMENT_SUMMARY.md](THEME_ENHANCEMENT_SUMMARY.md)

**Purpose**: Summary of theme system improvements and features
**Audience**: Frontend developers, designers
**Contains**: Theme system enhancements, color extraction, visual components

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

## 📝 Maintenance Instructions

### For Automated Agents:

When adding new documentation:

1. Create the file in the appropriate `docs/` subdirectory
2. Update this `INDEX.md` with the new file information
3. Update `TODOs.md` to reflect scope changes
4. Log the change in `CHANGELOG.md`

### For Developers:

- This index is maintained automatically by agents
- Manually update only when agents are not available
- Follow the established format for consistency
- Include purpose, audience, and contents for each file

**Last Updated**: Generated automatically by AI agent on 2025-08-28
