# Node.js Version Issues - Troubleshooting Guide

## Problem: Wrong Node.js Version in VS Code

**Symptoms:**

- `node --version` shows v18.x instead of v20.19.6
- Build fails with "Unsupported engine" warnings
- VS Code terminal uses system Node instead of nvm Node

## Why This Happens

VS Code terminals don't automatically load your shell configuration (`.zshrc`), so they use the system's default Node.js installation (`/usr/bin/node`) instead of nvm's version.

## Solutions (in order of preference)

### Solution 1: Automatic (Already Applied ✅)

The project now includes:

1. **`.nvmrc`** file - Specifies Node.js 20.19.6
2. **`.zshrc` auto-loading** - Automatically switches Node versions when entering the directory
3. **`.vscode/settings.json`** - Configures VS Code terminal to load shell properly

**To activate:**

```bash
# Close all VS Code terminals
# Open a new terminal - it should auto-load Node 20.19.6
node --version  # Should show v20.19.6
```

### Solution 2: Reload Shell Configuration

If the terminal still shows wrong version:

```bash
source ~/.zshrc
node --version  # Should now show v20.19.6
```

### Solution 3: Set Default Permanently

```bash
nvm alias default 20.19.6
```

### Solution 4: Use Helper Script

The project includes `scripts/with-node.sh`:

```bash
./scripts/with-node.sh pnpm dev
./scripts/with-node.sh pnpm build
```

### Solution 5: Manual Switch (Temporary)

In each new terminal:

```bash
nvm use 20.19.6
```

## Verification

Run these commands to verify everything is working:

```bash
# Check Node version
node --version
# Output: v20.19.6

# Check npm version
npm --version
# Output: 10.8.2

# Check which Node executable
which node
# Should show: ~/.nvm/versions/node/v20.19.6/bin/node
# NOT: /usr/bin/node

# Verify nvm is working
nvm current
# Output: v20.19.6
```

## For Team Members

When cloning the repository:

```bash
# 1. Install nvm (if not already installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 2. Reload shell
source ~/.zshrc

# 3. Navigate to project (auto-switches Node version)
cd Tahadialthalatheen

# 4. Install dependencies
pnpm install
```

## Prevention

The configuration ensures:

- ✅ New terminals in this directory auto-use Node 20.19.6
- ✅ VS Code respects the Node version
- ✅ CI/CD uses Node 20.19.6
- ✅ Netlify builds use Node 20.19.6

## Still Having Issues?

1. **Restart VS Code completely** (not just reload window)
2. **Close all terminals** before opening new ones
3. **Check nvm installation**: `command -v nvm` should return "nvm"
4. **Verify .zshrc**: `cat ~/.zshrc | grep -A 3 "NVM_DIR"` should show nvm configuration

## Emergency Workaround

If nothing works, use the system Node for now (not recommended):

```bash
# Update package.json temporarily
"engines": {
  "node": ">=18"
}
```

But this is not ideal - Node 20.19.6 LTS is required for optimal performance and security.
