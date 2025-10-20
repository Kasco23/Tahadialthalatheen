# Visual UI Changes Guide

This document shows the visual changes made to the application UI for the new features.

## 1. Invite Friends Button

### Location
- **Pages:** GameSetup.tsx and Lobby.tsx
- **Position:** Fixed position at bottom-right corner of the screen
- **Z-index:** 40 (above content but below modals)

### Appearance
```
Styling:
- Background: Gradient from blue-500 to blue-600
- Hover: Gradient from blue-600 to blue-700
- Shadow: 2xl with blue glow effect on hover
- Border radius: Full (rounded-full)
- Padding: py-4 px-6
- Font: Bold, white text
- Icon: Plus (+) symbol
- Animation: Scales to 110% on hover
```

### Visual Mockup
```
┌──────────────────────────────────────────┐
│                                          │
│     GameSetup / Lobby Page Content      │
│                                          │
│                                          │
│                                          │
│                                          │
│                              ╔══════════╗│
│                              ║ +        ║│
│                              ║ Invite   ║│
│                              ║ Friends  ║│
│                              ╚══════════╝│
└──────────────────────────────────────────┘
     Bottom-right: Fixed position button
     Blue gradient with shadow
```

## 2. Invite Friends Modal

### Trigger
Clicking the "Invite Friends" button opens this modal.

### Structure
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  👥 Invite Friends                   ✕  ┃ <- Green gradient header
┃  Session Code: ABC123                   ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                          ┃
┃  ┌────────────────────────────────────┐ ┃
┃  │ 👤  Ahmed                🇸🇦        │ ┃
┃  │     @ahmed                          │ ┃
┃  │                      [Invite]       │ ┃
┃  └────────────────────────────────────┘ ┃
┃                                          ┃
┃  ┌────────────────────────────────────┐ ┃
┃  │ 👤  Sara                 🇪🇬        │ ┃
┃  │     @sara                           │ ┃
┃  │                      [Invite]       │ ┃
┃  └────────────────────────────────────┘ ┃
┃                                          ┃
┃  ┌────────────────────────────────────┐ ┃
┃  │ M   Mohammed            🇵🇸        │ ┃ <- Avatar initial if no image
┃  │     @mohammed                       │ ┃
┃  │                      [Invite]       │ ┃
┃  └────────────────────────────────────┘ ┃
┃                                          ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃             [Close]                      ┃ <- Gray footer
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### Elements Breakdown

**Header:**
- Background: Green gradient (from-green-500 to-green-600)
- Title: "Invite Friends" with UserPlusIcon
- Session code display
- Close button (X) in top-right

**Friend List:**
- Scrollable area (max-height: 60vh)
- Each friend card shows:
  - Avatar: Circular image or colored circle with initial
  - Name: Bold, primary text
  - Username: Smaller, gray text with @
  - Flag: Country flag icon next to name
  - Invite button: Green with hover effect

**States:**
- Loading: Spinning loader
- Empty: "No friends yet" message
- Inviting: Button shows "Inviting..." and is disabled
- Success: Toast notification appears

## 3. Username Setup Banner

### Location
- **Pages:** Homepage.tsx, GameSetup.tsx, Lobby.tsx
- **Position:** Fixed at top of viewport
- **Z-index:** 50 (highest priority)

### Appearance
```
Styling:
- Background: Gradient from amber-500 to orange-600
- Width: Full viewport width
- Padding: py-3 px-4
- Shadow: lg
- Text: White, bold
- Buttons: White background with orange text
```

### Visual Mockup
```
╔═══════════════════════════════════════════════════════════════╗
║ ⚠️  Please set up your username to continue using all features║
║                                                                ║
║         [Set Username]                               [✕]      ║
╚═══════════════════════════════════════════════════════════════╝
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│             Rest of the page content                          │
│                                                               │
└───────────────────────────────────────────────────────────────┘

Orange/amber gradient background
White text with warning icon
Spans full width at top of page
```

### Banner States

**Visible When:**
- User is logged in
- Profile is loaded
- Username field is null or empty

**Hidden When:**
- User is not logged in
- Profile has username set
- User clicks dismiss (X) button

**Actions:**
- "Set Username" button → Navigate to `/profile`
- X button → Hide banner (temporary)

## 4. Notification in Inbox

When a friend receives an invite, they see this in their inbox:

```
┌────────────────────────────────────────────┐
│ 🏆  Game Invite                    2m ago  │
│                                            │
│ Ahmed invited you to join a game!         │
│                                            │
│ [Session: ABC123]                 [✕][✓]  │
└────────────────────────────────────────────┘
```

**Elements:**
- Icon: Trophy (match_invite type)
- Title: "Game Invite"
- Message: Sender's name + invitation text
- Timestamp: Relative time (2m ago, 1h ago, etc.)
- Clicking anywhere → Navigate to join page
- Read status indicator

## 5. Flow Diagrams

### Invite Flow
```
Host                                Friend
  │                                   │
  │ 1. Click "Invite Friends"        │
  ├──────────────────────────>       │
  │                                   │
  │ 2. Modal opens                   │
  │    Shows friend list              │
  │                                   │
  │ 3. Click "Invite" for friend     │
  ├──────────────────────────>       │
  │                                   │
  │ 4. Notification created          │
  │                                   │
  │                                   │ 5. Notification appears
  │                                   │    in inbox
  │                                   │
  │                                   │ 6. Click notification
  │                                   ├────────────>
  │                                   │
  │                                   │ 7. Navigate to join page
  │                                   │    with session code
  │                                   │
  │                                   │ 8. Join lobby as Player
  │<──────────────────────────────────┤
  │                                   │
  │ 9. See friend in lobby            │
```

### Auto-Room Creation Flow
```
User
  │
  │ 1. Click "Create Session" on Homepage
  ├─────────────>
  │
  │ 2. Session created in database
  │    Returns sessionId and sessionCode
  │
  │ 3. Auto-create Daily room
  │    (Background process)
  │     ↓
  │    If success: Store room URL
  │    If fail: Log error (non-blocking)
  │
  │ 4. Navigate to GameSetup
  ├─────────────>
  │
  │ 5. Room already ready
  │    OR manual creation available
```

### Username Banner Flow
```
User logs in
     │
     │ Profile loaded
     ├────────────>
     │
     ├─ Has username?
     │  ├─ Yes → No banner
     │  └─ No  → Show banner
     │           │
     │           ├─ Click "Set Username"
     │           │  └─> Navigate to Profile
     │           │       │
     │           │       └─> Set username
     │           │            │
     │           │            └─> Banner disappears
     │           │
     │           └─ Click X
     │              └─> Hide banner (temporary)
     │                   │
     │                   └─> Refresh page → Banner reappears
```

## 6. Responsive Design

### Mobile View (< 768px)

**Invite Button:**
```
┌──────────────┐
│              │
│    Content   │
│              │
│      ╔═══╗   │
│      ║ + ║   │
│      ║   ║   │ <- Smaller button
│      ╚═══╝   │
└──────────────┘
```

**Modal:**
- Full width with margin
- Scrollable friend list
- Stacked buttons

**Banner:**
- Full width
- Stacked text and buttons
- Smaller font size

### Desktop View (≥ 768px)

**Invite Button:**
- Larger size (py-4 px-6)
- Full text visible
- Prominent in corner

**Modal:**
- max-w-md width
- Centered on screen
- Side-by-side buttons

**Banner:**
- Horizontal layout
- Text and buttons on same line
- Full width with padding

## 7. Color Scheme

### Invite Friends
- **Primary:** Blue (#3B82F6 to #2563EB)
- **Hover:** Darker blue (#2563EB to #1D4ED8)
- **Shadow:** Blue glow on hover
- **Modal Header:** Green (#10B981 to #059669)

### Username Banner
- **Background:** Amber to Orange (#F59E0B to #EA580C)
- **Text:** White (#FFFFFF)
- **Button:** White background with orange text
- **Icon:** White warning icon

### Notification
- **Match Invite:** Trophy icon in yellow (#EAB308)
- **Background:** White with subtle shadow
- **Read:** Reduced opacity
- **Unread:** Full opacity, bold text

## 8. Animations & Interactions

### Invite Button
- **Hover:** Scale to 110%, shadow increases
- **Click:** Brief scale down, then opens modal
- **Duration:** 300ms with ease-in-out

### Modal
- **Open:** Fade in with scale from 95% to 100%
- **Close:** Fade out
- **Duration:** 200ms

### Banner
- **Appear:** Slide down from top
- **Dismiss:** Slide up and fade out
- **Duration:** 300ms

### Friend Card
- **Hover:** Background color lightens (gray-100)
- **Invite Click:** Button text changes, disabled state
- **Success:** Toast notification slides in from top

## 9. Accessibility Features

### Keyboard Navigation
- Tab through buttons and interactive elements
- Enter/Space to activate buttons
- Escape to close modal

### Screen Readers
- Descriptive aria-labels on all buttons
- Role attributes on modal elements
- Alt text on images

### Visual Indicators
- Focus rings on keyboard navigation
- Disabled states clearly visible
- Loading states with spinners
- Success/error feedback via toasts

## 10. Browser Compatibility

All features use standard React and Tailwind CSS:
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

No special polyfills or browser-specific code required.
