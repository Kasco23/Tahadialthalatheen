# Username Required Modal - Usage Guide

This guide explains how to use the Username Required Modal and `useUsernameCheck` hook throughout the application.

## Components

### 1. `UsernameRequiredModal`

A reusable modal component that prompts users to create a username.

**Props:**

- `isOpen: boolean` - Controls modal visibility
- `onClose?: () => void` - Callback when modal is closed (optional)
- `onSuccess?: () => void` - Callback when username is created successfully (optional)
- `message?: string` - Custom message to display (optional)

### 2. `useUsernameCheck` Hook

A hook that provides username checking functionality.

**Returns:**

- `hasUsername: boolean` - True if user has a valid username
- `showModal: boolean` - Current modal visibility state
- `requireUsername: () => boolean` - Function to check and show modal if needed
- `showUsernameModal: () => void` - Manually show the modal
- `hideUsernameModal: () => void` - Hide the modal

### 3. `useRequireUsername` Hook

A hook that automatically shows the modal on mount if user doesn't have a username.

**Options:**

- `autoShow?: boolean` - Automatically show modal on mount (default: true)
- `message?: string` - Custom message for the modal

**Returns:**

- `hasUsername: boolean` - True if user has a valid username
- `showModal: boolean` - Current modal visibility state
- `hideModal: () => void` - Hide the modal
- `message?: string` - The message passed in options

## Usage Examples

### Example 1: Basic Usage (Like in ActiveGames)

```tsx
import UsernameRequiredModal from "./UsernameRequiredModal";
import { useUsernameCheck } from "../hooks/useUsernameCheck";

function MyComponent() {
  const { requireUsername, showModal, hideUsernameModal } = useUsernameCheck();

  const handleAction = () => {
    // Check if user has username before proceeding
    if (!requireUsername()) {
      return; // Modal will show automatically
    }

    // Continue with your action
    console.log("User has username, proceeding...");
  };

  return (
    <>
      <UsernameRequiredModal
        isOpen={showModal}
        onClose={hideUsernameModal}
        message="You need a username to use this feature."
      />

      <button onClick={handleAction}>Do Something</button>
    </>
  );
}
```

### Example 2: Auto-show on Page Load

```tsx
import UsernameRequiredModal from "../components/UsernameRequiredModal";
import { useRequireUsername } from "../hooks/useUsernameCheck";

function FriendsPage() {
  const { hasUsername, showModal, hideModal } = useRequireUsername({
    autoShow: true,
    message: "You need a username to add friends.",
  });

  if (!hasUsername) {
    return (
      <UsernameRequiredModal
        isOpen={showModal}
        onClose={hideModal}
        message="You need a username to manage friends."
      />
    );
  }

  return <div>{/* Your friends page content */}</div>;
}
```

### Example 3: With Success Callback

```tsx
import { useState } from "react";
import UsernameRequiredModal from "./UsernameRequiredModal";
import { useUsernameCheck } from "../hooks/useUsernameCheck";

function SocialFeature() {
  const { requireUsername, showModal, hideUsernameModal } = useUsernameCheck();
  const [canProceed, setCanProceed] = useState(false);

  const handleSendFriendRequest = () => {
    if (!requireUsername()) {
      return;
    }

    // Send friend request logic
  };

  const handleUsernameCreated = () => {
    console.log("Username created successfully!");
    setCanProceed(true);
    // Automatically retry the action that required username
    handleSendFriendRequest();
  };

  return (
    <>
      <UsernameRequiredModal
        isOpen={showModal}
        onClose={hideUsernameModal}
        onSuccess={handleUsernameCreated}
        message="Create a username to send friend requests."
      />

      <button onClick={handleSendFriendRequest}>Send Friend Request</button>
    </>
  );
}
```

### Example 4: Conditional Feature Access

```tsx
import { useUsernameCheck } from "../hooks/useUsernameCheck";

function FeatureButton() {
  const { hasUsername, showUsernameModal } = useUsernameCheck();

  return (
    <button
      onClick={() => {
        if (!hasUsername) {
          showUsernameModal();
        } else {
          // Do the thing
        }
      }}
      className={hasUsername ? "enabled" : "disabled"}
    >
      {hasUsername ? "Use Feature" : "Create Username First"}
    </button>
  );
}
```

## Where to Use This

### Recommended Pages/Features:

1. **Friends Tab** - Adding/searching for friends
2. **Leaderboards** - Displaying username in rankings
3. **Profile Sharing** - Sharing profile via username
4. **Quick Join** - Joining games (already implemented in ActiveGames)
5. **Social Features** - Any feature involving user interaction
6. **Notifications** - Sending/receiving notifications between users

### Implementation Checklist:

- [ ] Friends page/tab
- [ ] Leaderboard display
- [ ] Quick join (✅ Done)
- [ ] Send friend requests
- [ ] Profile sharing
- [ ] Any social messaging features

## Validation Rules

The username must meet these criteria:

- **Length**: 3-20 characters
- **Characters**: Lowercase letters (a-z), numbers (0-9), underscores (\_) only
- **Uniqueness**: Must not already exist in the database

The modal automatically handles:

- Real-time input sanitization
- Validation errors
- Duplicate username detection
- Success/error toast notifications

## Styling

The modal uses the same green theme as the rest of the application with:

- Gradient backgrounds
- Backdrop blur effects
- Smooth transitions
- Responsive design
- Mobile-friendly layout

## Notes

- The modal has a z-index of 50, so it appears above most other content
- Users can skip the modal if `onClose` is provided
- The "Go to Profile Settings" button navigates to `/profile`
- The modal automatically closes on successful username creation
- Input is automatically sanitized to match validation rules
