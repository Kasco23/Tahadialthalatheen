# Components - Overview

**Category**: Reusable UI components  
**Location**: `/src/components/`  
**Total Files**: 30+ components + 2 subdirectories

---

## Purpose

Components are reusable React UI elements used across multiple pages. They encapsulate specific functionality, maintain their own state where appropriate, and follow a consistent design system based on Tailwind CSS and DaisyUI.

---

## Component Categories

### Video & Communication (4)

- VideoRoom.tsx - Daily.co video call wrapper with persistence
- VideoCall.tsx - Main video call container
- ParticipantTile.tsx - Individual video tile for each participant
- ControlsBar.tsx - Mute/unmute, video toggle controls

### Session Management (5)

- ActiveGames.tsx - Sidebar showing live sessions with Quick Join
- LobbyStatus.tsx - Session readiness and status indicators
- Timer.tsx - Countdown timer for quiz questions
- JoinModal.tsx - Modal for joining existing sessions
- RejoinModal.tsx - Modal for reconnecting to interrupted sessions

### User Customization (8)

- AvatarEditor.tsx - Upload and crop user avatar
- Flag.tsx - Display country flag component
- FlagSelector.tsx - Select country flag (standard version)
- OptimizedFlagSelector.tsx - Optimized flag picker with search
- TeamLogoPicker.tsx - Select team logo from grid
- LogoSelector.tsx - Team logo selection interface
- LobbyLogo.tsx - Display team logo in lobby
- UsernameSetupBanner.tsx - Prompt users to set username

### Visual & Background (4)

- StadiumBackground.tsx - Reusable stadium-themed wrapper
- LockerRoomBackground.tsx - Alternative locker room theme
- ChromaGrid.tsx - Animated background grid
- ChromaLogo.tsx - Animated logo component

### Notifications & Alerts (3)

- NotificationBell.tsx - Bell icon with unread count badge
- Alert.tsx - Toast-style notification component
- UsernameRequiredModal.tsx - Prompt for username completion

### Modals & Dialogs (3)

- InviteFriendsModal.tsx - Share session invitation
- PresetConfirmationModal.tsx - Confirm preset selections
- AuthForm.tsx - Reusable auth form component

### Profile Features (2 in subdirectory)

- profile/FriendsTab.tsx - Friends management interface
- profile/StatisticsTab.tsx - User statistics display

### ReactBits Integration (4 in subdirectory)

- ReactBits/AnimatedList.tsx - Smooth list animations
- ReactBits/Dock.tsx - MacOS-style dock component
- ReactBits/PixelCard.tsx - Pixelated card effect
- ReactBits/SpotlightCard.tsx - Spotlight hover effect

---

## Common Patterns

### Component Structure

```tsx
// Standard component structure
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

interface ComponentProps {
  // Props definition
}

export default function Component({ prop1, prop2 }: ComponentProps) {
  // Hooks
  const [state, setState] = useState();
  const { user } = useAuth();

  // Effects
  useEffect(() => {
    // Side effects
  }, [dependencies]);

  // Handlers
  const handleAction = () => {
    // Event handling
  };

  // Render
  return <div className="tailwind-classes">{/* JSX */}</div>;
}
```

### Styling Convention

- Tailwind CSS utility classes for all styling
- DaisyUI components for complex UI elements
- Consistent spacing (p-4, p-6, gap-4, etc.)
- Responsive design with mobile-first approach

### State Management

- Local state via `useState` for component-specific data
- Global state via Jotai atoms when shared across components
- Props drilling avoided using contexts (Auth, Daily)

---

## Testing

Components with tests:

- **ParticipantTile.test.tsx** - Video tile component tests
- **TeamLogoPicker.test.tsx** - Logo picker functionality tests

Test framework: Vitest + React Testing Library

---

## Dependencies

### Common Imports

- **React**: useState, useEffect, useCallback, useMemo
- **React Router**: useNavigate, useParams, Link
- **Heroicons**: Icon library (@heroicons/react/24/outline)
- **Daily.co**: @daily-co/daily-react for video
- **Supabase**: Database and storage operations
- **Jotai**: useAtom for global state

### External Libraries

- `react-hot-toast` - Toast notifications
- `react-easy-crop` - Image cropping (AvatarEditor)
- `framer-motion` - Animations (ReactBits)
- `flag-icons` - Country flag SVGs

---

## File Size Guidelines

- **Small**: < 5KB (simple display components)
- **Medium**: 5-10KB (components with moderate logic)
- **Large**: > 10KB (complex components with multiple features)

Most components fall in the 3-8KB range.

---

## See Also

- **CurrentState.md** - Detailed component specifications
- **Changelog.md** - Component updates and additions
- **Deprecated.md** - Removed components
- `/docs/Pages/` - Pages that use these components
