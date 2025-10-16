# Authentication & Profile Management Implementation

## Overview

This implementation adds a modern, professional authentication and profile management system to the Tahadialthalatheen football quiz application using Supabase Auth.

## Features Implemented

### 1. Authentication System
- **Signup Page** (`/signup`): User registration with email/password
  - Collects: name, email, password, optional team and flag
  - "Keep me signed in" checkbox for persistent sessions
  - Form validation and error handling
  - Auto-creates profile via Supabase trigger

- **Login Page** (`/login`): User authentication
  - Email/password sign-in
  - "Keep me signed in" option
  - Redirect to homepage after successful login
  - Link to signup for new users

- **Profile Page** (`/profile`): User profile management
  - View and edit user information (name, team, flag)
  - Avatar upload to Supabase Storage bucket `avatars`
  - Sign out functionality
  - Protected route (requires authentication)

### 2. Database Schema Updates
Updated TypeScript types in `src/lib/types/supabase.ts`:
- Added `Profiles` table with fields:
  - `id` (references auth.users)
  - `name`, `team`, `flag`
  - `avatar_url`
  - `created_at`, `updated_at`
- Updated `Session` table to use `host_profile_id` instead of `host_password`
- Updated `Participant` table to include `profile_id` field

### 3. React Context & Hooks
- **AuthContext** (`src/contexts/AuthContext.tsx`):
  - Manages authentication state
  - Provides user, session, and profile data
  - Handles auth state changes

- **Hooks**:
  - `useAuth()`: Access authentication state and methods
  - `useProfile()`: Access and update user profile

### 4. UI Components
- **AuthForm** (`src/components/AuthForm.tsx`):
  - Reusable form component for login and signup
  - Clean, minimal design with Tailwind CSS
  - Password visibility toggle
  - Form validation
  - Loading states and error handling

### 5. Homepage Integration
- Authentication check before session creation
- User menu in top-right corner showing:
  - User avatar and name
  - Profile link
  - Sign out button
- Sign in/Sign up buttons for unauthenticated users

## Technical Details

### Session Persistence
The implementation supports two session storage modes:
- **Persistent**: Uses `localStorage` (default when "Keep me signed in" is checked)
- **Session**: Uses session storage (when checkbox is unchecked)

Configured in `src/lib/supabaseClient.ts`:
```typescript
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
```

### Avatar Upload
- Uploads to Supabase Storage bucket: `avatars`
- Generates unique filenames: `{userId}-{random}.{ext}`
- Updates profile with public URL
- Shows loading state during upload

### Form Validation
- Email format validation
- Password minimum length (6 characters)
- Required field validation
- Displays Supabase error messages

### Styling
- Consistent with existing Tailwind CSS theme
- Football/soccer theme with green gradient backgrounds
- Responsive design for mobile and desktop
- Centered card layouts with subtle shadows
- Smooth transitions and hover effects

## Routes

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/signup` | User registration | No |
| `/login` | User authentication | No |
| `/profile` | Profile management | Yes |

## Environment Variables

Required in `.env`:
```
VITE_SUPABASE_DATABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_ENABLE_DUMMY_USER=false
```

## Screenshots

### Homepage (Unauthenticated)
![Homepage](https://github.com/user-attachments/assets/f15460dd-7958-45c2-979b-09cc8199cbf1)

### Signup Page
![Signup](https://github.com/user-attachments/assets/f2a25265-7750-4a4c-81d7-7872987c59c8)

### Login Page
![Login](https://github.com/user-attachments/assets/1fa3ad91-828b-4893-9924-90c75de16abc)

### Profile Page (Unauthenticated)
![Profile](https://github.com/user-attachments/assets/d6cceb0b-f173-4874-9344-67611880ae49)

## Migration Notes

### Backward Compatibility
The `createSession` function in `src/lib/mutations.ts` still uses passwords for backward compatibility with existing database triggers. Once the database migration is fully deployed and the `handle_new_user()` trigger is in place, this can be updated to use `host_profile_id` from the authenticated user.

### Future Improvements
1. Update `createSession` to use authenticated user's `profile_id`
2. Remove password-based session creation
3. Add password reset functionality
4. Add email verification flow
5. Add OAuth providers (Google, GitHub, etc.)

## Testing

### Manual Testing Required
Since this requires a live Supabase instance:
1. Set up Supabase project with Auth enabled
2. Create `Profiles` table and `handle_new_user()` trigger
3. Create `avatars` storage bucket
4. Test signup flow
5. Test login flow
6. Test profile updates
7. Test avatar upload
8. Test session persistence

### Build Validation
- ✅ TypeScript compilation passes
- ✅ Linting passes (2 warnings about fast refresh - acceptable)
- ✅ Production build succeeds
- ✅ Bundle sizes within limits

## Dependencies

No new dependencies added. Uses existing packages:
- `@supabase/supabase-js` (already installed)
- `react-hot-toast` (already installed)
- `@heroicons/react` (already installed)
- `react-router-dom` (already installed)
