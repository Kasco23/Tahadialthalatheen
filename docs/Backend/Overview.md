# Backend - Overview

**Last Updated**: October 22, 2025

## Architecture

The backend consists of two types of Netlify serverless functions:

### 1. **Netlify Functions** (Node.js)
Located in: `/netlify/functions/`
- Standard serverless functions running on Node.js runtime
- Used for API endpoints, scheduled tasks, and third-party integrations
- Examples: Daily.co room creation, notifications, profile storage

### 2. **Netlify Edge Functions** (Deno)
Located in: `/netlify/edge-functions/`
- Edge functions running on Deno runtime at the CDN edge
- Used for low-latency operations and session state management
- **Requires Deno to be installed for local development**

---

## Development Requirements

### Prerequisites

1. **Node.js 22+** - For main application and Netlify Functions
2. **Deno 2.5+** - **REQUIRED** for Edge Functions local development
3. **pnpm** - Package manager (auto-enabled via corepack)

### Installing Deno

If you encounter errors like:
```
Error: Could not establish a connection to the Netlify Edge Functions local development server
```

**Solution**: Install Deno runtime
```bash
curl -fsSL https://deno.land/install.sh | sh
```

Deno will be automatically added to your PATH. Restart your terminal or run:
```bash
export PATH="/home/node/.deno/bin:$PATH"
```

### Dev Container Configuration

The `.devcontainer/devcontainer.json` is configured to automatically install Deno on container creation. If you rebuild the container, Deno will be pre-installed.

---

## Running Locally

### Option 1: Direct Vite Dev Server (Recommended)
```bash
pnpm dev
```
- Starts Vite on `http://localhost:5173/`
- Emulates Edge Functions, serverless functions, and Netlify features
- **Requires Deno installed**

### Option 2: Netlify Dev Server
```bash
pnpm dev:netlify
```
- Requires Netlify authentication
- Full Netlify platform emulation
- Use when testing deployment-specific features

---

## Troubleshooting

### Edge Functions Not Starting

**Error**: `Could not establish a connection to the Netlify Edge Functions local development server`

**Cause**: Deno runtime not installed

**Solution**:
1. Install Deno: `curl -fsSL https://deno.land/install.sh | sh`
2. Add to PATH: `export PATH="/home/node/.deno/bin:$PATH"`
3. Restart dev server: `pnpm dev`

### Blobs Configuration Errors

**Error**: `MissingBlobsEnvironmentError`

**Cause**: Netlify Blobs requires authentication for local development

**Solution**: Use `pnpm dev:netlify` instead or configure environment variables
