# Troubleshooting Guide

**Last Updated**: October 22, 2025

---

## Development Server Issues

### ❌ Error: "Could not establish a connection to the Netlify Edge Functions local development server"

**Full Error Message**:
```
Error: Could not establish a connection to the Netlify Edge Functions local development server
    at EdgeFunctionsHandler.waitForDenoServer
```

**Root Cause**: 
Deno runtime is not installed. Netlify Edge Functions require Deno to run locally because they execute on the Deno runtime at the edge.

**Solution**:

1. **Install Deno**:
   ```bash
   curl -fsSL https://deno.land/install.sh | sh
   ```

2. **Verify Installation**:
   ```bash
   deno --version
   ```
   
   Expected output:
   ```
   deno 2.5.4 (stable, release, x86_64-unknown-linux-gnu)
   v8 14.0.365.5-rusty
   typescript 5.9.2
   ```

3. **Restart Dev Server**:
   ```bash
   pnpm dev
   ```

**Permanent Fix**:
The devcontainer is now configured to automatically install Deno when the container is created. If you rebuild the container (`Dev Containers: Rebuild Container`), Deno will be pre-installed.

---

### ⚠️ Warning: "MissingBlobsEnvironmentError"

**Error Message**:
```
Blobs operation failed: MissingBlobsEnvironmentError: The environment has not been configured to use Netlify Blobs
```

**Root Cause**: 
Netlify Blobs requires site credentials for local development. This is expected behavior when running without Netlify authentication.

**Impact**: 
- **Non-blocking**: The dev server continues running
- Only affects functions that use Netlify Blobs storage
- Frontend and other backend functions work normally

**Solutions**:

**Option 1**: Ignore the warning (recommended for frontend-only development)
- The warning doesn't affect most development workflows
- Functions using Blobs will return mock data locally

**Option 2**: Use Netlify Dev Server
```bash
pnpm dev:netlify
```
- Requires Netlify authentication (`netlify login`)
- Provides full Netlify platform emulation
- Blobs will work with your deployed site's storage

**Option 3**: Configure environment variables
Add to `.env.local`:
```bash
NETLIFY_BLOBS_SITE_ID=your_site_id
NETLIFY_BLOBS_TOKEN=your_token
```

---

### ⚠️ Warning: "Multiple instances of @netlify/vite-plugin"

**Warning Message**:
```
Warning: Multiple instances of @netlify/vite-plugin have been loaded
```

**Root Cause**: 
The Netlify Vite plugin may be configured multiple times in the dependency tree.

**Impact**: 
- Non-blocking warning
- Dev server functions normally
- May cause unexpected behavior if plugin is configured differently

**Solution**: 
Check `vite.config.ts` and remove duplicate Netlify plugin configurations if present.

---

## Build Issues

### TypeScript Errors

**Error**: Build fails with TypeScript compilation errors

**Solution**:
```bash
# Check for errors
pnpm build

# If errors persist, clean and rebuild
rm -rf node_modules .netlify dist
pnpm install
pnpm build
```

### Node Version Mismatch

**Error**: `Error: The module was compiled against a different Node.js version`

**Solution**:
```bash
# Verify Node version
node --version  # Should be 22+

# If wrong version, rebuild container or switch Node version
```

---

## Runtime Issues

### Edge Functions Not Executing

**Symptoms**: 
- Edge function routes return 404
- Edge function paths not intercepting requests

**Checklist**:
1. ✅ Deno is installed: `deno --version`
2. ✅ Edge functions exist in `/netlify/edge-functions/`
3. ✅ Functions are declared in `netlify.toml` under `[[edge_functions]]`
4. ✅ Dev server is running with Netlify middleware loaded

**Solution**: 
Check terminal output for:
```
[vite] ⬥ Netlify Middleware loaded. Emulating features: edgeFunctions
```

If not present, ensure `@netlify/vite-plugin` is properly configured.

---

## Authentication Issues

### Daily.co Functions Failing

**Error**: Daily.co room creation fails

**Cause**: Missing API keys

**Solution**: 
Check environment variables:
```bash
# Required for Daily.co integration
DAILY_API_KEY=your_daily_api_key
VITE_DAILY_DOMAIN=your_daily_domain
```

### Supabase Connection Errors

**Error**: `Failed to fetch` or authentication errors

**Cause**: Missing or incorrect Supabase credentials

**Solution**: 
Verify environment variables:
```bash
VITE_SUPABASE_DATABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key  # Backend only
```

---

## Getting Help

If none of these solutions work:

1. **Check Recent Changes**: Review `docs/Backend/Changelog.md` for recent updates
2. **Verify Environment**: Ensure all prerequisites are installed (Node 22+, Deno 2.5+, pnpm)
3. **Clean Install**: Remove `node_modules`, `.netlify`, and `dist` directories, then reinstall
4. **Container Rebuild**: If using dev containers, rebuild the container from scratch

---

## Quick Reference

### Essential Commands

```bash
# Start development server
pnpm dev

# Start with full Netlify emulation
pnpm dev:netlify

# Build for production
pnpm build

# Run tests
pnpm test

# Lint and format
pnpm lint && pnpm format

# Check Deno installation
deno --version

# Check Node version
node --version
```

### Required Versions

- **Node.js**: 22+
- **Deno**: 2.5+
- **pnpm**: 10.18+

### Key Files

- **Dev server config**: `vite.config.ts`
- **Netlify config**: `netlify.toml`
- **Environment**: `.env.local` (create from `.env.example`)
- **Dev container**: `.devcontainer/devcontainer.json`
