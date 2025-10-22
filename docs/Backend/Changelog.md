# Backend - Changelog

**Last Updated**: October 22, 2025

---

## October 22, 2025

### create-daily-token.ts - Enhanced Response

- **Change**: Function now returns both `token` and `room_url` in response
- **Reason**: Provide complete room information to frontend in single call
- **Features**:
  - Constructs room URL using `DAILY_DOMAIN` environment variable
  - Falls back to `VITE_DAILY_DOMAIN` or `thirty.daily.co` default
  - Returns: `{ token: string, room_url: string }`
  - Added comprehensive JSDoc documentation
- **Impact**: Frontend can verify/update room URL alongside token creation
- **Code Location**: Lines 1-113 in `netlify/functions/create-daily-token.ts`
- **API Change**: Response now includes `room_url` field (backwards compatible)

### Development Environment - Updated

- **Change**: Added Deno runtime requirement documentation
- **Reason**: Edge Functions require Deno for local development
- **Impact**: Developers must install Deno to run `pnpm dev` successfully
- **Solution**: 
  - Updated `devcontainer.json` to auto-install Deno on container creation
  - Added PATH configuration for Deno binary
  - Documented troubleshooting steps in Backend/Overview.md
- **Related Issue**: Fixed "Could not establish a connection to the Netlify Edge Functions local development server" error
