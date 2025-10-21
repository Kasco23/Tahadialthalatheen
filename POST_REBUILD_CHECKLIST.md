# Post-Rebuild Checklist

After you rebuild the container, follow this checklist to ensure everything is working correctly.

## 1️⃣ Verify Core Environment

```bash
# Node.js version (should be 22.x)
node --version

# pnpm version (should be 10.18.3 or compatible)
pnpm --version

# Python version (should be 3.12.x)
python3 --version

# GitHub CLI (should be 2.82.0+)
gh --version
```

**Expected Output**:
```
v22.19.0 (or similar v22.x)
10.18.3
Python 3.12.x
gh version 2.82.0
```

## 2️⃣ Verify Dependencies Installed

```bash
# Check if dependencies were installed
ls -la node_modules/.bin | head -10

# Count total packages
ls -1 node_modules | wc -l
```

**Expected**: Should see ~1000+ packages with tools like `vite`, `tsc`, `eslint`, `prettier`

## 3️⃣ Run Quick Tests

```bash
# Linting (should complete in ~3s)
pnpm lint

# Type checking (included in lint)
# If you see TypeScript errors, that's expected and needs fixing separately

# Formatting check
pnpm format

# Unit tests (should complete in ~3s)
pnpm test
```

## 4️⃣ Try Development Server

```bash
# Start dev server (should start in ~450ms)
pnpm dev

# Expected output:
# VITE v7.x.x  ready in XXX ms
# ➜  Local:   http://localhost:5173/
# ➜  Network: use --host to expose
```

Press `Ctrl+C` to stop after verifying it starts.

## 5️⃣ Try Production Build

```bash
# Build for production (should complete in ~10s)
pnpm build

# Check build output
ls -lh dist/

# Expected: dist/ folder with assets/ and index.html
```

## 6️⃣ Verify MCP Servers (Optional)

Check if MCP servers are configured:

```bash
# Check if npx can run (required for MCP servers)
npx --version

# Test github MCP (if token configured)
# Note: Will only work if GITHUB_PERSONAL_ACCESS_TOKEN is set
```

## 7️⃣ Check Environment Variables

```bash
# Verify NODE_OPTIONS is set
echo $NODE_OPTIONS

# Expected: --max-old-space-size=4096
```

## 8️⃣ Verify Git Configuration

```bash
# Check git status
git status

# Check current branch
git branch --show-current

# Expected: cleanup (or your working branch)
```

## Common Issues & Solutions

### Issue: `pnpm install` didn't run
**Solution**: Manually run `pnpm install --frozen-lockfile`

### Issue: Port 5173 already in use
**Solution**: 
```bash
lsof -ti:5173 | xargs kill -9
pnpm dev
```

### Issue: TypeScript errors during build
**Solution**: These are code-level issues, not environment issues. Fix them separately.

### Issue: Permission denied errors
**Solution**: Container should run as `node` user with proper permissions. Check:
```bash
whoami  # Should show: node
ls -la /workspaces/Tahadialthalatheen
```

## Missing Environment Variables

Your project requires these environment variables. Create `.env` file:

```bash
# Copy example if it exists
cp .env.example .env

# Or create manually
cat > .env << 'EOF'
VITE_SUPABASE_DATABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_DAILY_DOMAIN=your_daily_domain
SUPABASE_SERVICE_ROLE_KEY=your_service_key
DAILY_API_KEY=your_daily_api_key
EOF
```

**Note**: Without these, database and video call features won't work, but the app will still build.

## All Green? ✅

If all checks pass:
- ✅ Environment is properly configured
- ✅ Dependencies installed
- ✅ Can run dev server
- ✅ Can build for production
- ✅ Ready for development

## Next Steps

1. **Start Coding**: `pnpm dev` and open http://localhost:5173
2. **Run Tests**: Set up test watch mode with `pnpm test:watch`
3. **Check Errors**: Review any TypeScript/ESLint issues with `pnpm lint`
4. **Review Changes**: Check what's on your current branch with `git status`

## Need More Help?

- 📄 See `CODESPACE_FIX_SUMMARY.md` for what was fixed
- 📄 See `.github/copilot-instructions.md` for project overview
- 📄 See `README.md` for general project documentation
- 🐛 If issues persist, check `.codespaces/.persistedshare/creation.log`

---

**Last Updated**: After fixing Python version issue  
**Status**: Ready for rebuild ✅
