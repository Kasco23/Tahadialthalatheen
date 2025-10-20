# Username Modal - Visual Design

## Modal Appearance

```
┌─────────────────────────────────────────┐
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  [Green Gradient Header]          │ │
│  │                                   │ │
│  │            👤                     │ │
│  │     Username Required             │ │
│  └───────────────────────────────────┘ │
│  ┌───────────────────────────────────┐ │
│  │                                   │ │
│  │  You need to create a username    │ │
│  │  before joining games.            │ │
│  │                                   │ │
│  │  Choose Your Username             │ │
│  │  ┌─────────────────────────────┐ │ │
│  │  │ @ yourname_123              │ │ │
│  │  └─────────────────────────────┘ │ │
│  │  3-20 characters: lowercase       │ │
│  │  letters, numbers, underscores    │ │
│  │                                   │ │
│  │  ┌─────────────────────────────┐ │ │
│  │  │   Create Username           │ │ │
│  │  └─────────────────────────────┘ │ │
│  │  ┌─────────────────────────────┐ │ │
│  │  │   Go to Profile Settings    │ │ │
│  │  └─────────────────────────────┘ │ │
│  │                                   │ │
│  │       Skip for Now                │ │
│  │                                   │ │
│  └───────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
   [Blurred Backdrop - 70% Black]
```

## Component Hierarchy

```
UsernameRequiredModal
├── Backdrop (fixed, full screen, blurred)
└── Modal Container (centered, max-width 28rem)
    ├── Header Section
    │   ├── Icon (👤 emoji)
    │   └── Title ("Username Required")
    │
    └── Content Section
        ├── Message Text (customizable)
        ├── Form
        │   ├── Label ("Choose Your Username")
        │   ├── Input Field
        │   │   ├── @ Prefix (visual indicator)
        │   │   └── Text Input (sanitized)
        │   └── Helper Text (validation rules)
        │
        └── Action Buttons
            ├── Primary: "Create Username" (green gradient)
            ├── Secondary: "Go to Profile Settings" (green/50)
            └── Tertiary: "Skip for Now" (text only)
```

## Color Scheme

```css
/* Background Gradient */
from-green-900 → via-green-800 → to-green-900

/* Header Gradient */
from-green-600 → to-green-700

/* Border */
border-4 border-green-500/50

/* Input Field */
background: black/30
border: green-500/50
focus: green-400 + ring

/* Backdrop */
background: black/70
backdrop-blur: sm
```

## Interactive States

### Default State

```
┌─────────────────────┐
│ @ [cursor here]     │  ← Empty input, button disabled
└─────────────────────┘
```

### Typing State

```
┌─────────────────────┐
│ @ user[cursor]      │  ← Real-time sanitization
└─────────────────────┘
```

### Valid State

```
┌─────────────────────┐
│ @ username123       │  ← 3+ chars, button enabled
└─────────────────────┘
```

### Loading State

```
┌─────────────────────────────┐
│  [spinner] Creating...      │  ← Saving to database
└─────────────────────────────┘
```

### Error State (Toast)

```
╭─────────────────────────────────╮
│ ❌ Username already taken       │
╰─────────────────────────────────╯
```

### Success State (Toast)

```
╭─────────────────────────────────╮
│ ✅ Username created!            │
╰─────────────────────────────────╯
```

## Responsive Behavior

### Desktop (≥768px)

- Modal: 28rem (448px) width
- Centered on screen
- Full padding and spacing
- Large touch targets

### Mobile (<768px)

- Modal: 90% viewport width
- Centered with margins
- Slightly reduced padding
- Touch-optimized buttons

## Accessibility Features

1. **Keyboard Navigation**
   - Tab order: Input → Create → Profile → Skip
   - Enter key submits form
   - Escape key closes modal (if onClose provided)

2. **Focus Management**
   - Input auto-focused on open
   - Clear focus indicators
   - Focus trap within modal

3. **Screen Reader Support**
   - Proper label associations
   - Error announcements
   - Button descriptions

4. **Visual Indicators**
   - High contrast text
   - Large touch targets (44px min)
   - Clear disabled states
   - Loading indicators

## Animation Timing

```
Modal Open:
├── Backdrop: fade in (300ms)
└── Content: slide + fade in (300ms)

Modal Close:
├── Content: slide + fade out (300ms)
└── Backdrop: fade out (300ms)

Button Hover:
└── Scale: 1.05 (200ms ease)

Button Disabled:
└── Opacity: 0.6 + no transform
```

## Z-Index Layers

```
Layer 5 (z-50): Modal Content
Layer 4 (z-40): Modal Backdrop
Layer 3: Sidebar Content
Layer 2: Navigation
Layer 1: Page Content
```

## Input Sanitization Rules

```javascript
Input: "User@Name#123!"
Step 1: Convert to lowercase → "user@name#123!"
Step 2: Remove invalid chars → "username123"
Output: "username123"

Valid Pattern: /^[a-z0-9_]{3,20}$/
```

## Button States

### Create Username Button

```css
Default:
  bg: gradient (green-500 → green-600)
  hover: gradient (green-600 → green-700)
  disabled: gradient (gray-500 → gray-600)

Conditions:
  ✓ Enabled: username.length >= 3
  ✗ Disabled: username.length < 3 OR saving
```

### Go to Profile Button

```css
Default:
  bg: green-700/50
  hover: green-700

Action:
  navigate('/profile')
  onClose()
```

### Skip Button

```css
Default:
  color: green-300
  hover: white

Action:
  onClose()
```

## Integration Flow Diagram

```
User Action (e.g., Quick Join)
         ↓
   Has Username?
    ├─ Yes → Continue Action
    └─ No  → Show Modal
              ↓
        User Creates Username
              ↓
        Database Update
              ↓
          Success?
          ├─ Yes → onSuccess() → Continue Action
          └─ No  → Show Error → User Retries
```

## Example Usage Flow

```
1. User: Clicks "Quick Join" on game
   ↓
2. App: Checks requireUsername()
   ↓
3. Modal: Appears with focus on input
   ↓
4. User: Types "coolgamer_99"
   ↓
5. App: Sanitizes in real-time
   ↓
6. User: Clicks "Create Username"
   ↓
7. App: Validates and saves to DB
   ↓
8. Success: Modal closes, proceeds with join
```
