# Setup Instructions for Production Testing

## 🔧 Environment Setup

### 1. Update .env with Your Actual API Keys

You need to update the `.env` file with your actual API keys from your dashboards:

```bash
# Get these from: https://supabase.com/dashboard/project/projectID/settings/api
VITE_SUPABASE_URL=https://projectID.supabase.co
VITE_SUPABASE_ANON_KEY=  # Your actual anon key
SUPABASE_SERVICE_ROLE_KEY= # Your actual service role key

# Daily.co keys 
DAILY_API_KEY=
VITE_DAILY_DOMAIN=project.daily.co

# Required for Netlify Functions local development
NETLIFY_DEV=true
```

### 2. Get Your Supabase API Keys

1. Go to: <https://supabase.com/dashboard/project/zgvmkjefgdabumvafqch/settings/api>
2. Copy the "anon" key to `VITE_SUPABASE_ANON_KEY`
3. Copy the "service_role" key to `SUPABASE_SERVICE_ROLE_KEY`

## 🚀 Development with Full Features

### Use `netlify dev` instead of `pnpm run dev`

```bash
# This runs with Netlify Functions + Supabase production
netlify dev

# This should open: http://localhost:3000
```

This gives you:

- ✅ Netlify Functions (Daily.co room creation)
- ✅ Production Supabase connection
- ✅ Real environment variables
- ✅ Same setup as production

## 🧪 Testing the Existing Session

You have a saved session in your Supabase:

- **Game ID**: DU7FZG
- **Host Code**: T

### Test Flow

1. **Controller**: Go to `http://localhost:3000/control/DU7FZG`
2. **Host Join**: Go to `http://localhost:3000/join` and enter code `T`
3. **Test Video**: Should create Daily.co room and show video

## 📋 Deployment Testing

### 1. Build Test

```bash
pnpm run build
```

### 2. Deploy to Netlify

```bash
netlify deploy --prod
```

### 3. Test Live

- Live site: <https://thirtyquiz.tyshub.xyz>
- Should work with same session DU7FZG/T

## 🔍 Debugging

### Check Environment Variables

```bash
# In netlify dev, check if variables are loaded
echo $VITE_SUPABASE_URL
echo $DAILY_API_KEY
```

### Check Supabase Connection

Open browser console and check for any Supabase connection errors.

### Check Netlify Functions

Functions are in `netlify/functions/` and should be available at:

- `http://localhost:3000/.netlify/functions/create-daily-room`
- `http://localhost:3000/.netlify/functions/game-event`

## 📦 Package Updates Completed

- ✅ Supabase JS: 2.52.1 → 2.55.0
- ✅ Daily React: 0.23.1 → 0.23.2
- ✅ React Router: 7.8.0 → 7.8.1
- ✅ Vite: 7.1.1 → 7.1.3
- ✅ TypeScript ESLint: 8.39.0 → 8.40.0
- ✅ All other dependencies updated

Bundle size remains optimal: **26.1KB / 205KB limit** ✅
