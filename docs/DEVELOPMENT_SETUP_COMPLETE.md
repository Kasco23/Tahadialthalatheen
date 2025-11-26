# Complete Node.js & Development Environment Setup

## ✅ What Was Fixed

### 1. **Node.js Version Management**

- ✅ Installed Node.js 20.19.6 via nvm
- ✅ Set as nvm default: `nvm alias default 20.19.6`
- ✅ Updated system alternatives to point to nvm Node
- ✅ Updated `.zshrc` with auto-loading and directory switching
- ✅ Created `.nvmrc` file for automatic version detection

### 2. **Deno Installation**

- ✅ Installed Deno 2.5.6 (stable)
- ✅ Added to PATH in `.zshrc`
- ✅ Configured for Netlify Edge Functions

### 3. **VS Code Configuration**

- ✅ Created/Updated `.vscode/settings.json` with:
  - Custom terminal profile that auto-loads nvm
  - PATH includes Node 20.19.6 and Deno
  - TypeScript workspace settings
- ✅ Created `.vscode/tasks.json` with 8 one-click tasks

### 4. **Enhanced Package Scripts**

Added to `package.json`:

- `start` - Quick dev server (Vite only)
- `start:full` - Full stack (Netlify + Functions + Edge Functions)
- `verify` - Run lint + test + build
- `check` - Quick lint + format check
- `lint:fix` - Auto-fix linting issues
- `format:check` - Check formatting without fixing
- `clean` - Remove dist and vite cache
- `clean:all` - Nuclear option (removes everything)
- `reinstall` - Clean install from scratch

---

## 🚀 How to Use

### Starting Development

**Option 1: VS Code Tasks (Recommended)**

1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type "Run Task"
3. Choose:
   - 🚀 Start Vite Dev Server (frontend only)
   - 🌐 Start Netlify Dev Server (full stack with functions)
   - 🔨 Build Production
   - ✅ Verify (lint + test + build)

**Option 2: Terminal Commands**

```bash
# Quick start (Vite only)
pnpm start

# Full stack (with serverless functions)
pnpm start:full

# Build for production
pnpm build

# Run all checks
pnpm verify
```

### VS Code Terminal Setup

**IMPORTANT**: Close all existing terminals and open new ones for changes to take effect.

New terminals will automatically:

1. Load nvm
2. Switch to Node.js 20.19.6 (via `.nvmrc`)
3. Add Deno to PATH
4. Be ready to run any command

---

## 🔧 Troubleshooting

### Problem: Terminal still shows Node 18.x

**Solution 1: Close ALL terminals**

1. Close every terminal tab in VS Code
2. Click the trash icon on each terminal
3. Open a new terminal - should show Node 20.19.6

**Solution 2: Restart VS Code**

1. Close VS Code completely (not just window)
2. Reopen the project
3. Open new terminal

**Solution 3: Manual load (temporary fix)**

```bash
source ~/.zshrc
node --version  # Should show v20.19.6
```

**Solution 4: Check terminal profile**

1. Open VS Code settings (Ctrl+,)
2. Search for "terminal.integrated.defaultProfile.linux"
3. Ensure it's set to "zsh (nvm)"

### Problem: Netlify functions fail to load

**Error**: `Function requires Node.js version 20.12.2 or above, but 18.19.1 is installed`

**Solution**: This means the terminal is using old Node. Follow "Problem: Terminal still shows Node 18.x" steps above.

### Problem: Edge Functions don't work

**Error**: `Error setting up Edge Functions environment`

**Solution**: Deno is now installed. If you still see this:

```bash
# Verify Deno installation
deno --version  # Should show v2.5.6

# If not found, source your shell
source ~/.zshrc
deno --version
```

### Problem: `pnpm: command not found`

**Solution**:

```bash
# Enable corepack (comes with Node 20)
corepack enable

# Or install pnpm globally
npm install -g pnpm@latest
```

---

## 📋 Verification Checklist

Run these commands to verify everything is set up correctly:

```bash
# 1. Check Node version
node --version
# Expected: v20.19.6

# 2. Check npm version
npm --version
# Expected: 10.8.2

# 3. Check pnpm version
pnpm --version
# Expected: 10.19.0

# 4. Check Deno version
deno --version
# Expected: deno 2.5.6

# 5. Check which Node executable
which node
# Expected: /home/tareq/.nvm/versions/node/v20.19.6/bin/node

# 6. Verify nvm is loaded
nvm current
# Expected: v20.19.6

# 7. Test dev server
pnpm start
# Should start without Node version warnings

# 8. Test build
pnpm build
# Should complete successfully
```

---

## 🎯 Quick Reference

### Useful Commands

```bash
# Development
pnpm start              # Vite dev server (fast)
pnpm start:full         # Netlify dev (with functions)
pnpm build              # Production build
pnpm verify             # Lint + test + build

# Code Quality
pnpm lint               # Check for errors
pnpm lint:fix           # Auto-fix errors
pnpm format             # Format all files
pnpm format:check       # Check formatting
pnpm check              # Lint + format check

# Testing
pnpm test               # Run unit tests
pnpm test:watch         # Watch mode
pnpm test:coverage      # With coverage
pnpm test:e2e           # End-to-end tests

# Maintenance
pnpm clean              # Clear build cache
pnpm clean:all          # Nuclear clean
pnpm reinstall          # Fresh install

# Analysis
pnpm analyze            # Bundle size analysis
pnpm dep:graph          # Dependency graph
```

### VS Code Keyboard Shortcuts

- **Run Task**: `Ctrl+Shift+B` (or `Cmd+Shift+B`)
- **Command Palette**: `Ctrl+Shift+P` (or `Cmd+Shift+P`)
- **New Terminal**: `Ctrl+Shift+`` (backtick)
- **Kill Terminal**: Click trash icon or `Ctrl+D`

---

## 🌐 Server URLs

When running locally:

- **Vite Dev Server**: http://localhost:5173
- **Netlify Dev Proxy**: http://localhost:3000
- **Vite Preview** (after build): http://localhost:4173

---

## 📝 Files Modified

### Created/Updated:

- `.nvmrc` - Specifies Node.js 20.19.6
- `.vscode/settings.json` - Terminal and editor configuration
- `.vscode/tasks.json` - One-click task runner
- `package.json` - Enhanced scripts
- `~/.zshrc` - Shell configuration with nvm auto-loading
- `/usr/bin/node` - System alternative points to nvm Node

### Configuration Locations:

- **nvm**: `~/.nvm/`
- **Node 20.19.6**: `~/.nvm/versions/node/v20.19.6/`
- **Deno**: `~/.deno/`
- **pnpm store**: `~/.local/share/pnpm/store/`

---

## 🚨 Important Notes

1. **Always close all terminals** after configuration changes
2. **Restart VS Code** if terminals don't pick up new Node version
3. **Use VS Code tasks** for best experience (one-click start)
4. **Check `node --version`** before running any command if unsure
5. **The `.nvmrc` file** ensures everyone uses the same Node version

---

## 🎉 You're All Set!

Everything is configured for optimal development experience. You should never need to manually switch Node versions again - it's all automatic!

**Next Steps:**

1. Close all VS Code terminals
2. Open a new terminal
3. Run `pnpm start` or use VS Code tasks
4. Start building! 🚀
