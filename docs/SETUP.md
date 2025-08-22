# Setup Guide

This document provides comprehensive setup instructions for the Thirty Challenge project, including local development and deployment configuration.

## Prerequisites

- **Node.js** 18+ (Required for running the application)
- **pnpm** (Package manager - this project uses pnpm workspace)
- **Git** (Version control)
- **Google Chrome** (Recommended for development and debugging)

## Local Development Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd thirty-challenge-code
pnpm install
```

### 2. Environment Variables Configuration

Create a `.env.local` file in the project root (this file is gitignored for security):

```bash
# PUBLIC VARIABLES (VITE_ prefix - sent to browser)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_DAILY_DOMAIN=your-team.daily.co

# PRIVATE VARIABLES (server-side only - NO VITE_ prefix)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
DAILY_API_KEY=your_daily_api_key_here
```

### 3. Development Server Options

Choose the appropriate development mode for your needs:

```bash
# Frontend only (Vite dev server on localhost:5173)
pnpm dev

# Full stack with Netlify functions (localhost:8888)
pnpm dev:netlify

# Production preview (after building)
pnpm preview
```

## Netlify Environment Variables

When deploying to Netlify, configure the following environment variables in your Netlify dashboard:

### Required Public Variables

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Public anon key from Supabase
- `VITE_DAILY_DOMAIN` - Your Daily.co domain (e.g., "your-team.daily.co")

### Required Private Variables

- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for server-side operations
- `DAILY_API_KEY` - Daily.co API key for room management

### Build Configuration

- **Build Command**: `pnpm build`
- **Publish Directory**: `dist`
- **Functions Directory**: `netlify/functions`

## Supabase Configuration

### Database Setup

1. Create a new Supabase project
2. Run the schema migrations from `supabase/migrations/`
3. Seed initial data using `supabase/seed.sql`
4. Configure Row Level Security (RLS) policies as needed

### Environment Variables from Supabase

- Get your `VITE_SUPABASE_URL` from Project Settings > API
- Get your `VITE_SUPABASE_ANON_KEY` from Project Settings > API
- Get your `SUPABASE_SERVICE_ROLE_KEY` from Project Settings > API (keep this private!)

## Daily.co Configuration

### Account Setup

1. Create a Daily.co account
2. Get your domain name (appears as "your-team.daily.co")
3. Generate an API key from your Daily.co dashboard

### Environment Variables from Daily.co

- Set `VITE_DAILY_DOMAIN` to your Daily.co domain
- Set `DAILY_API_KEY` to your API key (keep this private!)

## Security Guidelines

### Important Security Notes

- **Never commit `.env` files** to version control
- **Only `VITE_` prefixed variables** are sent to the browser
- **Service role keys and API keys** must remain server-side only
- **Use different API keys** for development and production environments

### File Security

- `.env.local` is automatically gitignored
- Store production secrets in Netlify environment variables
- Rotate API keys regularly for production deployments

## Verification and Testing

### Development Server Verification

1. Start the development server:

   ```bash
   pnpm dev
   ```

2. Open `http://localhost:5173` in your browser

3. Verify the following functionality:
   - Page loads without console errors
   - Supabase connection works (check Network tab)
   - Theme switching functions properly

### Build Verification

1. Build the project:

   ```bash
   pnpm build
   ```

2. Preview the production build:

   ```bash
   pnpm preview
   ```

3. Run tests:
   ```bash
   pnpm test
   ```

## Troubleshooting

### Common Issues

1. **Environment Variable Issues**
   - Ensure `.env.local` exists and has correct values
   - Verify VITE\_ prefix for public variables
   - Check Netlify dashboard for deployment variables

2. **Build Failures**
   - Run `pnpm lint` to check for linting errors
   - Run `pnpm tsc --noEmit` to check TypeScript errors
   - Verify all dependencies are installed with `pnpm install`

3. **Video Integration Issues**
   - Verify Daily.co domain and API key are correct
   - Check browser console for Daily SDK errors
   - Ensure Netlify functions are deployed correctly

### Getting Help

- Check `docs/PROJECT_OVERVIEW.md` for project architecture
- Review `docs/DEVELOPER_GUIDE.md` for coding standards
- Open an issue on GitHub for specific problems
