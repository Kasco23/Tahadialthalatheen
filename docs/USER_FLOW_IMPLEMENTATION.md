# User Flow Diagrams - Implementation Summary

## 🎯 Overview

Successfully replaced the single mermaid flow diagram with a comprehensive state diagram generation system that creates 6 detailed Draw.io diagrams showing both frontend user interactions and backend state management for each user role.

## 📋 What Was Created

### 1. **GitHub Actions Workflow** (`.github/workflows/generate-flow.yml`)

- **Purpose**: Automatically generates user flow diagrams on code changes
- **Triggers**: Push to src/, scripts/, or workflow file changes + manual dispatch
- **Dependencies**: Node.js 20, pnpm, Python 3.11 for future extensions
- **Output**: Commits updated diagrams automatically to `docs/flows/`

### 2. **Diagram Generator Script** (`scripts/generate-user-flows.mjs`)

- **Language**: Node.js ES modules
- **Format**: Draw.io XML format (`.drawio` files)
- **Architecture**: Modular functions for each user role + flow type
- **Color Coding**:
  - 🔵 Frontend States (Indigo #4F46E5)
  - 🔴 Backend States (Red #DC2626)
  - 🟢 Shared/Completion States (Green #059669)
  - 🟣 Transition States (Purple #7C3AED)

### 3. **Generated State Diagrams** (`docs/flows/`)

#### **Controller Flow**

- **Frontend**: Landing → Create Session → Config → Control Room → Lobby/Quiz Management
- **Backend**: System Ready → Create Game Record → Initialize State → Setup Realtime → Monitor Connections → Game State Management

#### **Host Flow**

- **Frontend**: Landing → Join Game → Lobby Entry → Video Setup → Quiz Hosting → Segment/Score Control
- **Backend**: Game Exists → Load State → Subscribe → Video API → Game State Updates → Score/Timer Sync

#### **Player Flow**

- **Frontend**: Landing → Join Game → Player Setup → Lobby Wait → Quiz Participation → Bell/Score Interaction
- **Backend**: Game Available → Validate ID → Register Player → Subscribe → Sync State → Submit Answers/Receive Scores

### 4. **Package.json Integration**

- **New Script**: `pnpm flow:generate` for manual diagram generation
- **Usage**: Can be run locally or in CI/CD pipeline
- **Integration**: Works with existing `flow:update` and `dep:graph` scripts

## 🔧 Technical Implementation

### User Role Analysis

Based on comprehensive codebase analysis, identified three distinct user journeys:

1. **Controller**: Creates sessions, manages control room (PC-based interface)
2. **Host**: Joins sessions, manages video rooms, controls quiz flow
3. **Player**: Joins sessions, participates in quiz segments, uses buzzer

### State Management Architecture

- **Frontend**: React 19 + Jotai atoms + React Router navigation
- **Backend**: Supabase realtime channels + Daily.co video API + game state sync
- **Phases**: CONFIG → LOBBY → PLAYING → COMPLETED
- **Segments**: WSHA, AUCT, BELL, SING, REMO with segment-specific logic

### Draw.io Format Benefits

- **Professional**: Industry-standard diagramming format
- **Editable**: Can be opened in draw.io web app or VS Code extension
- **Version Control**: XML format works well with git diff/merge
- **Extensible**: Easy to add new states, transitions, or user roles

## 📁 File Structure

```
docs/flows/
├── README.md                           # Comprehensive documentation
├── controller-frontend-flow.drawio     # Controller UI interactions
├── controller-backend-flow.drawio      # Controller state management
├── host-frontend-flow.drawio          # Host UI interactions
├── host-backend-flow.drawio           # Host state management
├── player-frontend-flow.drawio        # Player UI interactions
└── player-backend-flow.drawio         # Player state management
```

## 🚀 Usage Instructions

### Manual Generation

```bash
pnpm flow:generate
```

### Automatic Generation

- Triggers automatically on push to main branch when src/ files change
- Available via "Actions" tab → "Generate User Flow Diagrams" → "Run workflow"

### Viewing Diagrams

1. **Online**: Upload .drawio files to https://app.diagrams.net/
2. **VS Code**: Install "Draw.io Integration" extension
3. **Git History**: Track changes through git diff on XML files

## 🎉 Advantages Over Previous System

### **Before**: Single Mermaid Diagram

- ❌ Limited detail and clarity
- ❌ Mixed frontend/backend concepts
- ❌ Hard to maintain and update
- ❌ No role-specific flows
- ❌ Text-based format hard to visualize

### **After**: Comprehensive State Diagrams

- ✅ **6 detailed diagrams** covering all user roles
- ✅ **Clear separation** of frontend vs backend concerns
- ✅ **Professional format** using industry-standard Draw.io
- ✅ **Automated generation** via GitHub Actions
- ✅ **Role-specific flows** for Controller, Host, and Player
- ✅ **Color-coded states** for easy comprehension
- ✅ **Comprehensive documentation** with README and usage guide

## 🔄 Maintenance

The system is designed to be **self-maintaining**:

1. **Code Changes**: Workflow automatically regenerates diagrams
2. **Manual Updates**: Use `pnpm flow:generate` for immediate updates
3. **Diagram Editing**: Edit .drawio files directly in draw.io, then commit
4. **Documentation**: Update `docs/flows/README.md` for new user roles or flows

## 📊 Impact

This implementation provides a **professional, maintainable, and comprehensive** documentation system that:

- **Improves onboarding** for new developers understanding user flows
- **Enhances planning** for new features and user role modifications
- **Supports debugging** by clearly showing state transitions
- **Enables stakeholder communication** with visual flow representations
- **Maintains documentation quality** through automated generation

The system replaces a simple text-based flow with a robust, visual documentation architecture that scales with the project's complexity.
