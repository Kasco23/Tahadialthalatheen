# GitHub Codespaces Setup Guide

This repository is configured for seamless development using GitHub Codespaces with automatic user settings sync.

## Quick Start

1. **Open in Codespaces**:
   - Navigate to the repository on GitHub
   - Click **Code** → **Codespaces** → **Create codespace on [branch]**
   - Wait for the container to build and configure (2-3 minutes)

2. **Automatic Setup**:
   - Node.js 22.17.0 is installed (matching `.nvmrc`)
   - pnpm package manager is configured
   - Dependencies are installed automatically
   - All recommended VS Code extensions are installed
   - Your personal settings sync automatically

3. **Start Development**:
   ```bash
   pnpm dev          # Start Vite dev server (port 5173)
   pnpm dev:netlify  # Start with Netlify functions (port 3000)
   ```

## Configuration Overview

### Container Features
- **Base Image**: Microsoft's Node.js 22 container
- **Package Manager**: pnpm (configured via corepack)
- **Additional Tools**: GitHub CLI, Docker-in-Docker, Supabase CLI
- **User**: Non-root (node user) for security

### VS Code Integration
- **Extensions**: 25+ development extensions auto-installed
- **Settings**: Optimized for React/TypeScript/Tailwind development
- **Debugging**: Chrome and Node.js configurations ready
- **Tasks**: Common pnpm commands accessible via Command Palette
- **User Sync**: Personal settings, keybindings, and themes preserved

### Port Forwarding
Automatic forwarding for development servers:
- **5173**: Vite development server
- **3000**: Netlify development server
- **8000**: Preview/alternative server
- **8080**: Additional development port

## Development Workflow

### First Time Setup
```bash
# Container automatically runs:
corepack enable
corepack prepare pnpm@latest --activate
pnpm install
.devcontainer/setup-supabase.sh  # Authenticates and links Supabase project
git config --global --add safe.directory ${containerWorkspaceFolder}
```

### Required Codespace Secrets
Before creating your codespace, add these secrets to your GitHub repository:

1. **Go to Settings** → **Codespaces** → **Repository secrets**
2. **Add these secrets**:
   - `SUPABASE_ACCESS_TOKEN`: Your Supabase access token ([get it here](https://supabase.com/dashboard/account/tokens))
   - `SUPABASE_PROJECT_REF`: Your project reference ID (from project URL: `https://PROJECT_REF.supabase.co`)
   - `SUPABASE_DB_PASSWORD`: Your database password (optional, for local development)

3. **Additional environment variables** (add to `.env` file after container setup):
   - `VITE_SUPABASE_ANON_KEY`: Your project's anon/public API key
   - `DAILY_API_KEY`: Your Daily.co API key (for video functionality)
   - `VITE_DAILY_DOMAIN`: Your Daily.co custom domain (optional)

### Additional Daily Development
```bash
# Start development
pnpm dev

# Start with Netlify functions (includes Supabase local)
pnpm dev:netlify

# Run Supabase locally (if needed)
supabase start

# Run tests
pnpm test

# Type checking
pnpm tsc --noEmit

# Linting
pnpm lint

# Building
pnpm build
```

### Supabase CLI Commands
After automatic setup, these commands are available:

```bash
# Check project status and local services
supabase status

# Start local Supabase (includes database, auth, storage)
supabase start

# Stop local services
supabase stop

# Push local schema changes to remote
supabase db push

# Pull remote schema changes to local
supabase db pull

# Generate TypeScript types from database schema
supabase gen types typescript --local > src/types/database.types.ts

# View logs
supabase logs
```

## Environment Variables and Secrets

### Codespace Secrets (Required)
Add these to **Settings** → **Codespaces** → **Repository secrets**:

- **`SUPABASE_ACCESS_TOKEN`**: Your Supabase access token
  - Get from: [Supabase Dashboard → Account → Access Tokens](https://supabase.com/dashboard/account/tokens)
  - Used for: CLI authentication and project management

- **`SUPABASE_PROJECT_REF`**: Your project reference ID
  - Format: The subdomain part of your project URL (`https://PROJECT_REF.supabase.co`)
  - Used for: Linking CLI to your specific project

- **`SUPABASE_DB_PASSWORD`**: Your database password (optional)
  - Used for: Local development and direct database connections

### Environment Variables (.env file)
The setup script will create a `.env` file based on `.env.example`. You'll need to add:

```env
# Auto-configured by setup script
VITE_SUPABASE_URL=https://your-project-ref.supabase.co

# You need to add these manually:
VITE_SUPABASE_ANON_KEY=your-anon-key-here
DAILY_API_KEY=your-daily-api-key
VITE_DAILY_DOMAIN=your-custom.daily.co
```

### Getting Missing Keys
1. **VITE_SUPABASE_ANON_KEY**: 
   - Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → Settings → API
   - Copy the "anon" key from the Project API keys section

2. **DAILY_API_KEY**: 
   - Go to [Daily.co Dashboard](https://dashboard.daily.co/developer)
   - Create or copy your API key

3. **Environment Variable Priority**:
   1. **Codespace Secrets**: Used for CLI authentication and sensitive data
   2. **Local `.env`**: For development configuration (auto-created by setup script)
   3. **`.env.example`**: Template with placeholder values

### Available Tasks
Access via **Terminal** → **Run Task** or `Ctrl+Shift+P` → "Tasks: Run Task":
- **pnpm: dev** - Start Vite development server
- **pnpm: dev:netlify** - Start Netlify development
- **pnpm: build** - Build for production
- **pnpm: test** - Run Jest tests
- **pnpm: lint** - Run ESLint
- **pnpm: format** - Format with Prettier

## User Settings Sync

GitHub Codespaces automatically syncs your:
- **Settings**: Editor preferences, theme, font size, etc.
- **Keybindings**: Custom keyboard shortcuts
- **Extensions**: Personal extensions (in addition to workspace recommendations)

### Privacy & Security
- Settings sync respects your GitHub privacy settings
- No secrets or credentials are stored in repository
- Environment variables use secure Codespaces secrets management

## Configuration Files

### `.devcontainer/`
- **`devcontainer.json`**: Main container configuration
- **`README.md`**: Detailed setup documentation

### `.vscode/`
- **`settings.json`**: Workspace-specific settings
- **`extensions.json`**: Recommended extensions
- **`launch.json`**: Debugging configurations  
- **`tasks.json`**: Development task definitions

## Environment Variables

For development with external services:

1. **Repository Secrets**: Set in repository settings for shared variables
2. **User Secrets**: Set in your Codespaces settings for personal tokens
3. **Local `.env`**: For development configuration (auto-created by setup script)

Example `.env` (auto-created by setup script):
```bash
# Project URL (auto-configured)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co

# You need to add these manually:
VITE_SUPABASE_ANON_KEY=your-anon-key-here
DAILY_API_KEY=your-daily-api-key
VITE_DAILY_DOMAIN=your-custom.daily.co
```

## Troubleshooting

### Common Issues

**Extensions not loading**:
```bash
# Restart VS Code or manually install
code --install-extension <extension-id>
```

**pnpm not available**:
```bash
corepack enable
corepack prepare pnpm@latest --activate
```

**Port forwarding not working**:
- Check **Ports** panel in VS Code
- Ensure application is running on correct port
- Check firewall/security settings

**Git authentication issues**:
```bash
# Re-authenticate with GitHub
gh auth login
```

**Supabase CLI issues**:
```bash
# Check if authenticated
supabase status

# Re-authenticate if needed
supabase login --token $SUPABASE_ACCESS_TOKEN

# Re-link project if needed
supabase link --project-ref $SUPABASE_PROJECT_REF

# Check local services
supabase start
```

**Missing environment variables**:
```bash
# Check if .env file was created
cat .env

# If missing, manually create it
cp .env.example .env
# Edit .env file with your actual values
```

### Performance Tips

- **Use port forwarding** instead of preview URLs when possible
- **Close unused terminals** to save resources
- **Use `.gitignore`** to exclude large directories from sync
- **Pause Codespace** when not actively developing

## Differences from Local Development

### Advantages
- ✅ **Consistent Environment**: Same setup for all developers
- ✅ **Zero Setup Time**: Ready to code immediately
- ✅ **Cloud Resources**: Better performance for builds
- ✅ **Automatic Backups**: Work is saved in the cloud
- ✅ **Easy Sharing**: Share running environment via URL

### Considerations
- 🔄 **Internet Required**: Cannot work offline
- 💰 **Usage Limits**: Free tier has monthly limits
- ⏱️ **Startup Time**: 2-3 minutes for container creation
- 🔄 **File Sync**: Large files may sync slowly

## Integration with Project Workflow

This Codespaces setup integrates with the project's established patterns:

- **Follows `docs/AGENTS.md`**: Respects coding standards and workflows
- **Uses `pnpm`**: Matches project package manager choice
- **Supports all scripts**: Every `package.json` script works
- **Includes all tools**: Madge, Playwright, Jest, etc.
- **Maintains bundle size**: Bundle guard and dependency mapping work

## Getting Help

1. **Repository Issues**: For project-specific problems
2. **Codespaces Docs**: [GitHub Codespaces Documentation](https://docs.github.com/en/codespaces)
3. **VS Code Docs**: [VS Code in Codespaces](https://code.visualstudio.com/docs/remote/codespaces)

This setup provides a complete, personalized development environment that matches your local VS Code while ensuring team consistency.