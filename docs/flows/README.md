# User Flow State Diagrams

This directory contains comprehensive state diagrams for the Thirty Challenge Quiz application, showing both frontend user interactions and backend state management for each user role.

## Diagrams Overview

### Controller Flow

- **controller-frontend-flow.drawio**: Frontend interactions for session creation and control room management
- **controller-backend-flow.drawio**: Backend state management for session creation and realtime setup

### Host Flow

- **host-frontend-flow.drawio**: Frontend interactions for quiz hosting and segment control
- **host-backend-flow.drawio**: Backend state management for game state updates and video room API

### Player Flow

- **player-frontend-flow.drawio**: Frontend interactions for game participation and buzzer usage
- **player-backend-flow.drawio**: Backend state management for player registration and score sync

## User Roles

### Controller

- Creates new game sessions from landing page
- Manages control room interface (PC-based)
- Monitors participant connections
- Controls session lifecycle

### Host

- Joins existing game sessions
- Manages video room creation and setup
- Controls quiz flow and segment progression
- Updates scores and manages timers

### Player

- Joins games via game ID
- Participates in quiz segments
- Uses buzzer for bell segments
- Views real-time scores and rankings

## Technical Implementation

**Frontend**: React 19 + Vite 7 + Tailwind CSS
**Backend**: Supabase realtime + Daily.co video API  
**State Management**: Jotai atoms with game sync
**Deployment**: Netlify static hosting

## Color Coding

- 🔵 **Frontend States** (Indigo): User interface interactions
- 🔴 **Backend States** (Red): Server-side state management
- 🟢 **Shared States** (Green): Common completion states
- 🟣 **Transitions** (Purple): State change triggers

Generated on: 2025-08-21T14:03:23.750Z
