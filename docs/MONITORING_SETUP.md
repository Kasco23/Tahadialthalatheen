# Comprehensive Monitoring Setup Guide

This document outlines the complete monitoring setup for the Thirty Quiz application using Sentry for both frontend and backend monitoring.

## 🎯 Overview

The monitoring system provides:

- **Frontend Error Tracking**: React error boundaries, performance monitoring, session replay
- **Backend Function Monitoring**: All Netlify functions instrumented with error tracking and performance monitoring
- **User Feedback**: Integrated feedback dialogs for error reporting
- **Release Tracking**: Automated versioning and release management
- **Performance Monitoring**: Traces, profiling, and performance insights

## 🔧 Setup Instructions

### 1. Environment Variables

Set the following environment variables:

#### Local Development

```bash
export SENTRY_DSN="your-sentry-dsn-here"
export SENTRY_AUTH_TOKEN="your-auth-token-here"  # Optional for local development
```

#### Netlify Production

In your Netlify site settings (Build & deploy → Environment variables):

```
SENTRY_DSN=your-sentry-dsn-here
SENTRY_AUTH_TOKEN=your-auth-token-here
NODE_ENV=production
```

### 2. Frontend Monitoring

#### Configuration Location

- **Main Config**: `src/main.tsx` - Sentry initialization with runtime DSN fetching
- **Error Boundary**: `src/components/ErrorBoundary.tsx` - React error boundary with Sentry integration
- **App Wrapper**: `src/App.tsx` - Application wrapped with error boundary

#### Features Enabled

- ✅ Error tracking with source maps
- ✅ Performance monitoring (traces: 100% dev, 10% prod)
- ✅ Profiling (100% dev, 5% prod)
- ✅ Session replay (100% sessions)
- ✅ User feedback dialogs
- ✅ Release tracking with version management

#### Test Error Button

The "Break the world" button on the landing page triggers a test error with:

- User context and tags
- Custom error metadata
- User feedback dialog
- Full Sentry event capture

### 3. Backend Monitoring

#### Instrumented Functions

All Netlify functions are instrumented with Sentry monitoring:

```typescript
// Example usage in any function
const { withSentry, createApiResponse } = require('./_sentry.js');

const myHandler = async (event, context) => {
  // Your function logic here
  return createApiResponse(200, { success: true });
};

export const handler = withSentry('my-function', myHandler);
```

#### Instrumented Functions List

1. `create-daily-room.ts` - Video room creation
2. `game-event.ts` - Game event tracking
3. `supabase-health.ts` - Database health checks
4. `batch-check-rooms.ts` - Bulk room operations
5. `check-daily-room.ts` - Room status verification
6. `create-daily-token.ts` - Authentication tokens
7. `daily-diagnostics.ts` - System diagnostics
8. `delete-daily-room.ts` - Room cleanup
9. `get-room-presence.ts` - User presence tracking
10. `get-sentry-dsn.js` - Runtime DSN provider

#### Function Features

- ✅ Error tracking and stack traces
- ✅ Performance monitoring (traces: 100% dev, 10% prod)
- ✅ Function-specific tags and context
- ✅ Automatic error responses with proper CORS
- ✅ Environment-specific configuration

### 4. Release Management

#### Version Generation

Versions are automatically generated from:

```
{package.json.version}-{git-commit-sha.slice(0,7)}
```

#### Release Configuration

- **Build Time**: Vite plugin creates releases and uploads source maps
- **Runtime**: Version available via `import.meta.env.VITE_APP_VERSION`
- **Sentry Integration**: Releases linked to commits for better debugging

#### Netlify Build Setup

```toml
# netlify.toml
[build]
  command = "pnpm build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "22"
  PNPM_VERSION = "10"
```

### 5. Local Development

#### Test Server

Start the enhanced local server:

```bash
SENTRY_DSN=your-dsn node scripts/serve-with-dsn.js
```

Features:

- Serves built application from `dist/`
- Provides runtime DSN endpoint
- Simulates Netlify function monitoring
- Proper MIME types for ES modules

#### Monitoring Test

Run comprehensive monitoring tests:

```bash
export SENTRY_DSN=your-dsn
./scripts/test-monitoring.sh
```

This script:

- Builds the project with monitoring
- Starts test server
- Runs Playwright tests for frontend monitoring
- Tests backend function endpoints
- Verifies Sentry event transmission

### 6. Production Deployment

#### Netlify Configuration

1. Set environment variables in Netlify dashboard
2. Deploy triggers automatic:
   - Source map upload to Sentry
   - Release creation with commit linking
   - Function instrumentation

#### Verification Steps

1. Check Sentry dashboard for new release
2. Verify source maps are uploaded
3. Test error tracking with the "Break the world" button
4. Monitor function calls in Sentry performance section

## 📊 Monitoring Features

### Frontend Monitoring

- **Error Tracking**: Automatic React error boundary integration
- **Performance**: Page load times, component render performance
- **Session Replay**: Record user sessions for debugging
- **User Feedback**: Integrated feedback forms on errors
- **Release Tracking**: Version-specific error attribution

### Backend Monitoring

- **Function Errors**: All function errors automatically tracked
- **Performance Traces**: Function execution time monitoring
- **Context Tags**: Function name, HTTP method, environment
- **Error Responses**: Standardized error responses with CORS
- **Health Monitoring**: Database and service health checks

### User Experience

- **Error Boundaries**: Graceful error handling with recovery options
- **Feedback Dialogs**: User-friendly error reporting
- **Performance Insights**: Real user monitoring data
- **Release Notes**: Error attribution to specific releases

## 🧪 Testing

### Manual Testing

1. Visit the application
2. Click "Break the world" button
3. Verify error appears in Sentry dashboard
4. Test user feedback dialog
5. Check function monitoring in Sentry performance

### Automated Testing

```bash
# Run monitoring test suite
./scripts/test-monitoring.sh

# Build with monitoring
pnpm build

# Test individual functions
curl http://localhost:8888/.netlify/functions/supabase-health
```

### Monitoring Verification

- Check Sentry Issues tab for new errors
- Review Performance tab for traces
- Verify Releases tab shows current version
- Test user feedback submission

## 📁 File Structure

```
src/
├── main.tsx                     # Sentry initialization
├── components/
│   └── ErrorBoundary.tsx        # Enhanced error boundary
├── pages/
│   └── Landing.tsx              # Test error button
└── App.tsx                      # App wrapper with error boundary

netlify/
└── functions/
    ├── _sentry.js               # Shared monitoring utilities
    ├── create-daily-room.ts     # Instrumented function example
    ├── game-event.ts            # Instrumented function example
    └── ...                      # All other instrumented functions

scripts/
├── serve-with-dsn.js           # Enhanced local test server
├── test-monitoring.sh          # Comprehensive test suite
└── instrument-functions.sh     # Batch function instrumentation

vite.config.ts                  # Sentry build plugin configuration
```

## 🚨 Troubleshooting

### Common Issues

1. **No Sentry Events**
   - Verify SENTRY_DSN is set correctly
   - Check browser dev tools for network errors
   - Ensure DSN endpoint returns valid response

2. **Source Maps Not Uploaded**
   - Verify SENTRY_AUTH_TOKEN is set
   - Check build logs for Sentry plugin output
   - Ensure proper org/project configuration

3. **Function Monitoring Not Working**
   - Check function logs in Netlify dashboard
   - Verify \_sentry.js is deployed correctly
   - Test function endpoints directly

4. **User Feedback Not Appearing**
   - Ensure showReportDialog is called after error capture
   - Check for popup blockers
   - Verify Sentry project allows user feedback

### Debug Commands

```bash
# Test DSN endpoint
curl http://localhost:5173/.netlify/functions/get-sentry-dsn

# Check build output
pnpm build --verbose

# Test function locally
netlify dev

# Monitor network requests
# Use browser dev tools Network tab
```

## 📈 Monitoring Dashboards

### Sentry Dashboard Sections

1. **Issues**: Error tracking and management
2. **Performance**: Transaction and trace monitoring
3. **Releases**: Version tracking and deployment health
4. **User Feedback**: User-submitted error reports
5. **Alerts**: Automated notification setup

### Key Metrics to Monitor

- Error rate and frequency
- Function execution time
- User session quality
- Release health scores
- Performance regression detection

## 🔄 Maintenance

### Regular Tasks

- Review and resolve Sentry issues
- Monitor performance regression alerts
- Update monitoring configuration as needed
- Test monitoring setup after major releases

### Updates

- Keep Sentry SDK versions updated
- Review and adjust sample rates based on volume
- Update monitoring documentation for new features

---

This monitoring setup provides comprehensive observability for both frontend and backend components, enabling proactive issue detection and resolution.
