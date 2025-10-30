# Components - Current State

**Last Updated**: October 21, 2025  
**Total Active**: 30+ components

---

## Video & Communication

### VideoRoom.tsx

- **Status**: ✅ Active, High Priority
- **Purpose**: Persistent Daily.co video call wrapper
- **Used In**: Lobby, Quiz pages
- **Key Features**: Maintains video across page navigation, auto-join, cleanup
- **Dependencies**: @daily-co/daily-react, Jotai atoms
- **Size**: ~8KB

### VideoCall.tsx

- **Status**: ✅ Active
- **Purpose**: Main video call container UI
- **Used In**: VideoRoom wrapper
- **Key Features**: Participant grid, controls, screen sharing
- **Size**: ~10KB

### ParticipantTile.tsx

- **Status**: ✅ Active, Tested
- **Purpose**: Individual video tile for each participant
- **Used In**: VideoCall, Lobby
- **Key Features**: Video feed, mute indicators, name display
- **Tests**: ParticipantTile.test.tsx
- **Size**: ~6KB

### ControlsBar.tsx

- **Status**: ✅ Active
- **Purpose**: Video call controls (mute, camera, leave)
- **Used In**: VideoCall
- **Key Features**: Toggle audio/video, leave call, screen share
- **Size**: ~4KB

---

## Session Management

### ActiveGames.tsx

- **Status**: ✅ Active
- **Purpose**: Sidebar displaying live sessions with Quick Join
- **Used In**: Homepage
- **Key Features**: Real-time session list, one-click join, participant count
- **Dependencies**: Supabase real-time subscriptions
- **Size**: ~12KB

### LobbyStatus.tsx

- **Status**: ✅ Active
- **Purpose**: Display session readiness status
- **Used In**: Lobby, GameSetup
- **Key Features**: Ready indicators, participant count, host status
- **Size**: ~5KB

### Timer.tsx

- **Status**: ✅ Active
- **Purpose**: Countdown timer for quiz questions
- **Used In**: Quiz page
- **Key Features**: Animated countdown, time alerts, auto-submit
- **Size**: ~4KB

### JoinModal.tsx

- **Status**: ✅ Active
- **Purpose**: Modal for joining sessions via code
- **Used In**: Homepage
- **Key Features**: Code input, validation, quick join
- **Size**: ~6KB

### QuestionManager.tsx

- **Status**: ✅ Active, NEW
- **Purpose**: CRUD interface for quiz questions
- **Used In**: GameSetup page
- **Key Features**: Add/delete questions, segment filtering, answer validation, correct answer marking
- **Dependencies**: Supabase Questions table, Framer Motion
- **Size**: ~18KB
- **Database**: Reads/writes to Questions table with RLS
- **Validation**: Minimum 2 answers, open-ended detection (WDYK/AUCT), difficulty selection

### RejoinModal.tsx

- **Status**: ✅ Active
- **Purpose**: Reconnect to interrupted sessions
- **Used In**: Various pages (global)
- **Key Features**: Session recovery, seat restoration
- **Size**: ~5KB

---

## User Customization

### AvatarEditor.tsx

- **Status**: ✅ Active
- **Purpose**: Upload and crop user profile picture
- **Used In**: Profile page
- **Key Features**: Image upload, crop/zoom, Supabase storage upload
- **Dependencies**: react-easy-crop
- **Size**: ~10KB

### Flag.tsx

- **Status**: ✅ Active
- **Purpose**: Display country flag SVG
- **Used In**: Lobby, Profile, Leaderboard
- **Key Features**: Responsive sizing, flag-icons library integration
- **Size**: ~2KB

### FlagSelector.tsx

- **Status**: ✅ Active
- **Purpose**: Basic flag selection component
- **Used In**: Join flow (fallback)
- **Size**: ~5KB

### OptimizedFlagSelector.tsx

- **Status**: ✅ Active, Preferred
- **Purpose**: Optimized flag picker with search and virtualization
- **Used In**: FlagSelection page, Join flow
- **Key Features**: Search 200+ countries, virtualized scrolling, performance optimized
- **Size**: ~8KB

### TeamLogoPicker.tsx

- **Status**: ✅ Active, Tested
- **Purpose**: Grid-based team logo selection
- **Used In**: TeamSelection page, Join flow
- **Key Features**: Visual logo grid, Supabase storage integration
- **Tests**: TeamLogoPicker.test.tsx
- **Size**: ~7KB

### LogoSelector.tsx

- **Status**: ✅ Active
- **Purpose**: Alternative logo selection interface
- **Used In**: TeamSelection page
- **Key Features**: Similar to TeamLogoPicker with different UI
- **Size**: ~6KB

### LobbyLogo.tsx

- **Status**: ✅ Active
- **Purpose**: Display team logo in lobby/game
- **Used In**: Lobby, Quiz pages
- **Key Features**: Load from Supabase storage, fallback handling
- **Size**: ~3KB

### UsernameSetupBanner.tsx

- **Status**: ✅ Active
- **Purpose**: Prompt authenticated users without username to set one
- **Used In**: Homepage
- **Key Features**: Dismissible banner, navigate to profile
- **Size**: ~4KB

---

## Visual & Background

### StadiumBackground.tsx

- **Status**: ✅ Active, Widely Used
- **Purpose**: Reusable stadium-themed background wrapper
- **Used In**: Homepage, Lobby, Profile, Inbox, Leaderboard
- **Key Features**: Gradient background, football theming, responsive
- **Size**: ~5KB

### LockerRoomBackground.tsx

- **Status**: ✅ Active
- **Purpose**: Alternative locker room themed background
- **Used In**: Auth pages (Signup/Login)
- **Key Features**: Different aesthetic for auth flow
- **Size**: ~4KB

### ChromaGrid.tsx

- **Status**: ✅ Active
- **Purpose**: Animated grid background effect
- **Used In**: Various pages for visual enhancement
- **Key Features**: Animated grid lines, customizable colors
- **Size**: ~3KB

### ChromaLogo.tsx

- **Status**: ✅ Active
- **Purpose**: Animated logo with chroma effect
- **Used In**: Homepage, loading screens
- **Key Features**: Gradient animation, responsive sizing
- **Size**: ~3KB

---

## Notifications & Alerts

### NotificationBell.tsx

- **Status**: ✅ Active
- **Purpose**: Bell icon with unread notification count
- **Used In**: Homepage header
- **Key Features**: Real-time unread count, badge display, navigate to inbox
- **Dependencies**: Supabase subscriptions
- **Size**: ~1.6KB

### Alert.tsx

- **Status**: ✅ Active
- **Purpose**: Toast-style notification component
- **Used In**: Throughout app for user feedback
- **Key Features**: Success/error/info variants, auto-dismiss
- **Size**: ~3KB

### UsernameRequiredModal.tsx

- **Status**: ✅ Active
- **Purpose**: Block actions until username is set
- **Used In**: Session creation/join flows
- **Key Features**: Modal overlay, forced action
- **Size**: ~4KB

---

## Modals & Dialogs

### InviteFriendsModal.tsx

- **Status**: ✅ Active
- **Purpose**: Share session invitation with friends
- **Used In**: Lobby page
- **Key Features**: Copy session code, share link
- **Size**: ~5KB

### PresetConfirmationModal.tsx

- **Status**: ✅ Active
- **Purpose**: Confirm preset configurations before applying
- **Used In**: GameSetup page
- **Key Features**: Preview settings, confirm/cancel
- **Size**: ~4KB

### AuthForm.tsx

- **Status**: ✅ Active
- **Purpose**: Reusable authentication form component
- **Used In**: Signup, Login pages
- **Key Features**: Email/password inputs, validation, error display
- **Size**: ~6KB

---

## Profile Features (Subdirectory: profile/)

### profile/FriendsTab.tsx

- **Status**: ✅ Active
- **Purpose**: Friends management interface for Profile page
- **Used In**: Profile page (Friends tab)
- **Key Features**: Send requests, accept/decline, view friend list
- **Dependencies**: Supabase friends table
- **Size**: ~12KB

### profile/StatisticsTab.tsx

- **Status**: ✅ Active
- **Purpose**: Display user match statistics
- **Used In**: Profile page (Statistics tab)
- **Key Features**: Wins, losses, win rate, charts
- **Dependencies**: Supabase matches view
- **Size**: ~8KB

---

## ReactBits Integration (Subdirectory: ReactBits/)

### ReactBits/AnimatedList.tsx

- **Status**: ✅ Active
- **Purpose**: Smooth list animations with framer-motion
- **Used In**: Leaderboard, Inbox
- **Key Features**: Enter/exit animations, staggered timing
- **Size**: ~4KB

### ReactBits/Dock.tsx

- **Status**: ✅ Active
- **Purpose**: MacOS-style dock component
- **Used In**: Future navigation enhancement
- **Key Features**: Magnification effect, icon hover
- **Size**: ~6KB

### ReactBits/PixelCard.tsx

- **Status**: ✅ Active
- **Purpose**: Card with pixelated hover effect
- **Used In**: Various card layouts
- **Key Features**: Retro pixel animation on hover
- **Size**: ~5KB

### ReactBits/SpotlightCard.tsx

- **Status**: ✅ Active
- **Purpose**: Card with spotlight hover effect
- **Used In**: Homepage session cards
- **Key Features**: Gradient spotlight follows cursor
- **Size**: ~5KB

---

## Technical Notes

### Testing Coverage

- ParticipantTile: ✅ Full coverage
- TeamLogoPicker: ✅ Full coverage
- Others: Manual testing

### Performance

- Large components use React.memo for optimization
- Virtualization for long lists (OptimizedFlagSelector)
- Lazy image loading where applicable

### Accessibility

- Semantic HTML elements
- ARIA labels on interactive elements
- Keyboard navigation support

---

## See Also

- **Overview.md** - Component categories
- **Changelog.md** - Recent updates
- **Deprecated.md** - Removed components
