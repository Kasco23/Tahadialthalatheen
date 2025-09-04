# Production Deployment Guide

This guide covers the production deployment setup for the Tahadialthalatheen football quiz application.

## 🚀 Production Setup

### Prerequisites

- Node.js 22 or higher
- pnpm 10 or higher
- Netlify account
- Supabase project
- Daily.co account

### Environment Variables

Create the following environment variables in your Netlify dashboard:

```bash
# Supabase Configuration
VITE_SUPABASE_DATABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Daily.co Configuration  
DAILY_API_KEY=your_daily_api_key
VITE_DAILY_API_KEY=your_daily_api_key
```

### Build Configuration

The project is configured for optimal production builds:

- **Build Command**: `corepack enable && pnpm i --frozen-lockfile && pnpm build`
- **Publish Directory**: `dist`
- **Functions Directory**: `netlify/functions`
- **Node Version**: 22

### Security Features

✅ **Security Headers**: Comprehensive CSP, XSS protection, and frame options  
✅ **Asset Caching**: Static assets cached for 1 year with immutable flag  
✅ **SPA Routing**: Proper client-side routing support  
✅ **API Proxy**: Serverless functions accessible via `/api/*`  

### Performance Optimizations

- Tree-shaking enabled for minimal bundle size
- CSS and JS minification
- Gzip compression
- Image optimization
- Font preloading

### CI/CD Pipeline

The project includes a comprehensive CI workflow (`.github/workflows/ci.yml`) that:

1. **Tests**: Runs unit tests and TypeScript checks
2. **Builds**: Creates production builds and analyzes bundle size
3. **E2E Tests**: Runs Playwright end-to-end tests
4. **Security**: Performs dependency audits

### Deployment Options

#### Option 1: Netlify CLI Deployment

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod --dir=dist --functions=netlify/functions
```

#### Option 2: Git-based Deployment

1. Connect your repository to Netlify
2. Configure build settings in Netlify dashboard
3. Set environment variables
4. Deploy automatically on push to main branch

### Monitoring & Analytics

- **Build Logs**: Monitor build performance and errors
- **Function Logs**: Track serverless function execution
- **Performance**: Use Lighthouse CI for performance monitoring
- **Security**: Regular dependency audits via GitHub workflows

### Troubleshooting

**Build Failures:**
- Check Node.js version (must be 22+)
- Verify all environment variables are set
- Ensure pnpm lockfile is committed

**Function Errors:**
- Verify DAILY_API_KEY is set in environment
- Check function logs in Netlify dashboard
- Ensure Supabase connection is working

**Runtime Issues:**
- Check browser console for client-side errors
- Verify CSP headers aren't blocking resources
- Test WebSocket connections for real-time features

### Local Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run with Netlify dev (includes functions)
pnpm dev:netlify

# Run tests
pnpm test

# Build for production
pnpm build
```

### Bundle Analysis

Monitor bundle size and dependencies:

```bash
# Generate dependency map
pnpm dep:graph

# Analyze bundle
pnpm analyze
```

---

## 📊 Production Checklist

- [ ] Environment variables configured
- [ ] Security headers enabled
- [ ] Performance monitoring setup
- [ ] Error tracking configured
- [ ] Database migrations applied
- [ ] SSL certificate configured
- [ ] CDN caching optimized
- [ ] Function monitoring enabled
