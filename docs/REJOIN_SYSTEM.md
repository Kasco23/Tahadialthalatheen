# Rejoin System Documentation

## Overview

The Rejoin System allows participants (both Hosts and Players) to securely rejoin game sessions using password authentication. This feature enhances the user experience by allowing participants to:

- Rejoin sessions after disconnection
- Update their configuration (name, flag, team logo) when rejoining
- Securely authenticate using password protection
- Quick rejoin from the "Active Games" list on the homepage

## Key Features

### 🔐 Password-Protected Rejoin

- Participants create a password when first joining a session
- Passwords are hashed using SHA-256 before storage
- Authentication required for all rejoin attempts

### 🎨 Configuration Updates

- Participants can keep their existing configuration
- Or update their name, flag, and team logo when rejoining
- Changes are immediately reflected in the Supabase database

### 🚀 Quick Rejoin Detection

- System automatically detects existing participants when entering a session code
- "Rejoin as Existing Participant" button appears when applicable
- Works seamlessly with the "Quick Join" button from Active Games

### 👥 Role Support

- Works for both Host and Player roles
- Host can rejoin using their session password
- Players create their own passwords independent of the session password

## User Flows

### First-Time Join Flow

#### For Players:

1. Navigate to Join page (or click "Quick Join" from Active Games)
2. Enter session code
3. Enter player name
4. **Create password** (minimum 4 characters)
5. Select country flag
6. Select team logo
7. Join lobby

#### For Hosts:

1. Navigate to Join page
2. Enter session code
3. Enter host password (session password)
4. **Host password is also used for rejoin**
5. Select country flag
6. Select team logo
7. Join lobby

### Rejoin Flow

1. Navigate to Join page
2. Enter session code (existing participants automatically detected)
3. Click **"🔄 Rejoin as Existing Participant"** button
4. **RejoinModal appears** with list of participants
5. Select your participant from the list
6. Enter your password
7. Choose rejoin option:
   - **"Rejoin Session"**: Keep existing name/flag/logo
   - **"Rejoin & Update"**: Update configuration after authentication
8. On successful authentication:
   - If "Rejoin Session": Navigate directly to lobby
   - If "Rejoin & Update": Proceed to flag/logo selection, then join lobby

## Technical Implementation

### Database Schema

```sql
-- Participant table with password column
ALTER TABLE "public"."Participant"
ADD COLUMN IF NOT EXISTS "password" TEXT DEFAULT NULL;
```

**Notes:**

- Password field is nullable for backward compatibility
- Stores SHA-256 hash, never plain text
- 64-character hexadecimal string

### Password Hashing

**File:** `src/lib/passwordHash.ts`

```typescript
import { hashPassword } from "./lib/passwordHash";

// Hash a password
const hash = await hashPassword("mySecurePassword");
// Returns: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8"

// Verify a password (automatically done during rejoin)
const isValid = await verifyPassword("mySecurePassword", hash);
// Returns: true
```

**Security:**

- Uses Web Crypto API's SHA-256 algorithm
- Client-side hashing before transmission
- No plain-text passwords stored or transmitted

### Key Mutations

**File:** `src/lib/mutations.ts`

#### 1. getSessionParticipants()

```typescript
const participants = await getSessionParticipants(sessionId);
// Returns array of participants without passwords
```

#### 2. setParticipantPassword()

```typescript
await setParticipantPassword(participantId, passwordHash);
// Sets password hash for a participant
```

#### 3. verifyParticipantPassword()

```typescript
const result = await verifyParticipantPassword(participantId, passwordHash);
// Returns: { valid: boolean, participant?: ParticipantData }
```

#### 4. updateParticipantConfig()

```typescript
await updateParticipantConfig(participantId, {
  name: "New Name",
  flag: "us",
  team_logo_url: "https://example.com/logo.png",
});
```

#### 5. rejoinAsParticipant()

```typescript
const { participantId, role, sessionId } = await rejoinAsParticipant(
  participantId,
  passwordHash,
  {
    // Optional config updates
    name: "Updated Name",
    flag: "gb",
    team_logo_url: "https://example.com/new-logo.png",
  },
);
```

### Components

#### RejoinModal

**File:** `src/components/RejoinModal.tsx`

**Props:**

```typescript
interface RejoinModalProps {
  isOpen: boolean;
  participants: RejoinParticipant[];
  onClose: () => void;
  onRejoin: (
    participantId: string,
    password: string,
    updateConfig: boolean,
  ) => Promise<void>;
  isLoading: boolean;
}
```

**Features:**

- Visual list of participants with flags and logos
- Password input with validation
- "Update configuration" checkbox
- Loading states and error handling
- Responsive design

## Integration Points

### Join.tsx Updates

**Automatic Participant Detection:**

```typescript
useEffect(() => {
  const checkExistingParticipants = async () => {
    const sessionId = await getSessionIdByCode(sessionCode);
    const participants = await getSessionParticipants(sessionId);

    if (participants.length > 0) {
      setRejoinParticipants(participants);
    }
  };

  // Debounced check when session code changes
  const timer = setTimeout(checkExistingParticipants, 500);
  return () => clearTimeout(timer);
}, [sessionCode]);
```

**Password Storage on First Join:**

```typescript
// For players
const passwordHash = await hashPassword(playerPassword);
await setParticipantPassword(participantId, passwordHash);

// For hosts
const passwordHash = await hashPassword(hostPassword);
await setParticipantPassword(participantId, passwordHash);
```

### ActiveGames.tsx

The "Quick Join" button automatically passes the session code as a URL parameter:

```typescript
navigate(`/join?sessionCode=${sessionCode}`);
```

This triggers the rejoin detection flow in Join.tsx, showing the rejoin button if applicable.

## Security Considerations

### Password Security

✅ **What We Do:**

- SHA-256 hashing on client side
- No plain-text storage
- Hash comparison for verification
- Nullable password field (backward compatible)

⚠️ **Limitations:**

- SHA-256 is not the most secure for passwords (consider bcrypt/argon2 for production)
- Client-side hashing means passwords are known to the client
- No rate limiting on rejoin attempts (implement server-side for production)

### Recommended Improvements for Production

1. **Server-Side Password Hashing:**

   ```typescript
   // Create Netlify function for password operations
   // POST /.netlify/functions/set-password
   // POST /.netlify/functions/verify-password
   ```

2. **Use bcrypt or argon2:**

   ```bash
   npm install bcryptjs
   ```

3. **Add Rate Limiting:**
   - Limit rejoin attempts per participant
   - Add exponential backoff for failed attempts

4. **Password Strength Requirements:**
   - Minimum 8 characters
   - Mix of letters, numbers, symbols
   - Password strength indicator

## Testing

### Manual Testing Scenarios

#### Scenario 1: Player First Join with Password

1. Navigate to `/join?sessionCode=ABC123`
2. Enter player name: "TestPlayer"
3. Enter password: "test1234"
4. Select flag and logo
5. Verify join successful
6. Check Supabase: Password hash stored in Participant table

#### Scenario 2: Player Rejoin (Keep Config)

1. Disconnect from session
2. Navigate to `/join`
3. Enter session code: "ABC123"
4. Click "Rejoin as Existing Participant"
5. Select "TestPlayer" from list
6. Enter password: "test1234"
7. Leave "Update configuration" unchecked
8. Click "Rejoin Session"
9. Verify: Navigate directly to lobby with existing config

#### Scenario 3: Player Rejoin (Update Config)

1. Navigate to `/join`
2. Enter session code: "ABC123"
3. Click "Rejoin"
4. Select participant
5. Enter password
6. Check "Update configuration"
7. Click "Rejoin & Update"
8. Verify: Proceed to flag/logo selection
9. Change flag and logo
10. Verify: Join lobby with new config
11. Check Supabase: Config updated in Participant table

#### Scenario 4: Failed Authentication

1. Navigate to `/join`
2. Enter session code
3. Click "Rejoin"
4. Select participant
5. Enter wrong password: "wrongpass"
6. Verify: Error message displayed
7. Verify: Cannot proceed to lobby

#### Scenario 5: Quick Join from Active Games

1. Navigate to Homepage
2. See "Active Games" section
3. Click "Quick Join" on a session
4. Verify: Session code pre-filled
5. Verify: Rejoin button appears if applicable
6. Follow rejoin flow

## Error Handling

### Common Errors and Solutions

| Error                                       | Cause                  | Solution                  |
| ------------------------------------------- | ---------------------- | ------------------------- |
| "Invalid password or participant not found" | Wrong password         | Re-enter correct password |
| "Failed to get session code"                | Database query error   | Check Supabase connection |
| "Session is full"                           | All player slots taken | Wait for slot to open     |
| "Failed to rejoin as participant"           | Database update error  | Check permissions, retry  |

### Error States in UI

**RejoinModal:**

- Shows error message in red banner
- Keeps modal open for retry
- Disables buttons during loading
- Clear error on modal close

**Join.tsx:**

- Alert component for critical errors
- Form validation before submission
- Loading states on buttons

## Future Enhancements

### Planned Improvements

1. **Password Reset Flow**
   - Email/SMS verification
   - Temporary reset tokens
   - Admin override for hosts

2. **Remember Me Option**
   - Store encrypted password in localStorage
   - Auto-fill on rejoin
   - Secure token-based approach

3. **Multi-Factor Authentication**
   - Email verification code
   - SMS verification
   - Authenticator app support

4. **Session History**
   - View past sessions
   - Rejoin with same credentials
   - Favorite sessions

5. **Enhanced Security**
   - bcrypt/argon2 password hashing
   - Rate limiting
   - Account lockout after failed attempts
   - Password strength requirements

## API Reference

See `src/lib/mutations.ts` for complete API documentation.

### Quick Reference

```typescript
// Get participants for a session
getSessionParticipants(sessionId: string): Promise<RejoinParticipant[]>

// Set participant password
setParticipantPassword(participantId: string, passwordHash: string): Promise<void>

// Verify participant password
verifyParticipantPassword(
  participantId: string,
  passwordHash: string
): Promise<{ valid: boolean, participant?: ParticipantData }>

// Update participant config
updateParticipantConfig(
  participantId: string,
  config: { name?: string, flag?: string, team_logo_url?: string }
): Promise<void>

// Complete rejoin flow
rejoinAsParticipant(
  participantId: string,
  passwordHash: string,
  config?: { name?: string, flag?: string, team_logo_url?: string }
): Promise<{ participantId: string, role: string, sessionId: string }>
```

## Troubleshooting

### Issue: Rejoin button not appearing

**Possible causes:**

- Session code not yet entered
- No existing participants in session
- Database query failed

**Solution:**

- Ensure session code is entered correctly
- Check browser console for errors
- Verify Supabase connection

### Issue: Password authentication failing

**Possible causes:**

- Incorrect password
- Password hash mismatch
- Database issue

**Solution:**

- Double-check password
- Verify password was set during first join
- Check Supabase logs

### Issue: Config not updating

**Possible causes:**

- Database permissions
- Invalid config data
- Update mutation failed

**Solution:**

- Check RLS policies in Supabase
- Verify flag/logo URLs are valid
- Check browser console for errors

## Support

For issues or questions:

1. Check browser console for errors
2. Review Supabase logs
3. Check network tab for failed requests
4. Refer to main project README

## Migration Guide

### For Existing Users

If you have existing participants without passwords:

1. **Run Migration:**

   ```sql
   ALTER TABLE "public"."Participant"
   ADD COLUMN IF NOT EXISTS "password" TEXT DEFAULT NULL;
   ```

2. **Existing Participants:**
   - Can still join normally
   - Will be prompted to create password on next join
   - Password field is nullable (no breaking changes)

3. **Testing:**
   - Test with both new and existing participants
   - Verify backward compatibility
   - Check that NULL passwords don't cause errors
