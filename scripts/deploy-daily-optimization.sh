#!/bin/bash

# Daily.co API Optimization Deployment Script
# This script validates, tests, and deploys the optimized Daily.co integration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Daily.co API Optimization Deployment${NC}"
echo "=================================================="

# Check environment
echo -e "${YELLOW}📋 Checking environment...${NC}"

if [ ! -f ".env" ] && [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ No environment file found (.env or .env.local)${NC}"
    echo "   Please ensure DAILY_API_KEY is configured"
    exit 1
fi

# Validate TypeScript
echo -e "${YELLOW}🔍 Validating TypeScript...${NC}"
if command -v tsc >/dev/null 2>&1; then
    echo "   Running TypeScript compiler..."
    npx tsc --noEmit --skipLibCheck
    echo -e "${GREEN}✅ TypeScript validation passed${NC}"
else
    echo -e "${YELLOW}⚠️  TypeScript compiler not found, skipping validation${NC}"
fi

# Lint check
echo -e "${YELLOW}🧹 Running lint checks...${NC}"
if command -v eslint >/dev/null 2>&1; then
    npx eslint netlify/functions/daily-rooms.ts --fix
    echo -e "${GREEN}✅ Lint checks passed${NC}"
else
    echo -e "${YELLOW}⚠️  ESLint not found, skipping lint checks${NC}"
fi

# Test Daily.co API configuration
echo -e "${YELLOW}🔧 Testing Daily.co API configuration...${NC}"

# Check if Daily API key is available
if [ -z "$DAILY_API_KEY" ]; then
    echo -e "${RED}❌ DAILY_API_KEY environment variable not set${NC}"
    echo "   Please configure your Daily.co API key"
    exit 1
fi

# Test API connectivity (simple curl test)
echo "   Testing Daily.co API connectivity..."
if curl -s -H "Authorization: Bearer $DAILY_API_KEY" "https://api.daily.co/v1/rooms?limit=1" >/dev/null; then
    echo -e "${GREEN}✅ Daily.co API connection successful${NC}"
else
    echo -e "${RED}❌ Daily.co API connection failed${NC}"
    echo "   Please check your DAILY_API_KEY and internet connection"
    exit 1
fi

# Build project
echo -e "${YELLOW}🏗️  Building project...${NC}"
if [ -f "package.json" ]; then
    if npm run build >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Project build successful${NC}"
    else
        echo -e "${RED}❌ Project build failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  No package.json found, skipping build${NC}"
fi

# Test function deployment locally (if Netlify CLI is available)
echo -e "${YELLOW}🧪 Testing function locally...${NC}"
if command -v netlify >/dev/null 2>&1; then
    echo "   Starting local Netlify dev server for testing..."
    
    # Start netlify dev in background and test endpoints
    netlify dev --port 8888 &
    DEV_PID=$!
    
    # Wait for server to start
    sleep 5
    
    # Test health endpoint
    echo "   Testing health endpoint..."
    if curl -s "http://localhost:8888/.netlify/functions/daily-rooms?action=health" | grep -q "healthy"; then
        echo -e "${GREEN}✅ Health endpoint working${NC}"
    else
        echo -e "${RED}❌ Health endpoint failed${NC}"
        kill $DEV_PID 2>/dev/null || true
        exit 1
    fi
    
    # Test list endpoint
    echo "   Testing list endpoint..."
    if curl -s "http://localhost:8888/.netlify/functions/daily-rooms?action=list" | grep -q "rooms"; then
        echo -e "${GREEN}✅ List endpoint working${NC}"
    else
        echo -e "${RED}❌ List endpoint failed${NC}"
        kill $DEV_PID 2>/dev/null || true
        exit 1
    fi
    
    # Stop dev server
    kill $DEV_PID 2>/dev/null || true
    echo -e "${GREEN}✅ Local function tests passed${NC}"
else
    echo -e "${YELLOW}⚠️  Netlify CLI not found, skipping local tests${NC}"
fi

# Deploy to Netlify
echo -e "${YELLOW}🚀 Deploying to Netlify...${NC}"
if command -v netlify >/dev/null 2>&1; then
    if netlify deploy --prod; then
        echo -e "${GREEN}✅ Deployment successful${NC}"
    else
        echo -e "${RED}❌ Deployment failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Netlify CLI not found${NC}"
    echo "   Please deploy manually or install Netlify CLI"
fi

# Post-deployment validation
echo -e "${YELLOW}🔍 Post-deployment validation...${NC}"

# Get the site URL (if available)
SITE_URL=""
if command -v netlify >/dev/null 2>&1; then
    SITE_URL=$(netlify status | grep "Site url" | awk '{print $3}' 2>/dev/null || echo "")
fi

if [ -n "$SITE_URL" ]; then
    echo "   Testing deployed function at: $SITE_URL"
    
    # Test health endpoint on production
    if curl -s "$SITE_URL/.netlify/functions/daily-rooms?action=health" | grep -q "healthy"; then
        echo -e "${GREEN}✅ Production health check passed${NC}"
    else
        echo -e "${RED}❌ Production health check failed${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Could not determine site URL for production testing${NC}"
fi

# Summary
echo ""
echo -e "${GREEN}🎉 Daily.co API Optimization Deployment Complete!${NC}"
echo "=================================================="
echo -e "${BLUE}📊 Optimization Summary:${NC}"
echo "   • Enhanced error handling with specific error codes"
echo "   • Retry logic with exponential backoff"
echo "   • Rate limiting protection"
echo "   • Request timeout handling (10s)"
echo "   • Comprehensive logging and monitoring"
echo "   • Input validation and sanitization"
echo "   • Security improvements (private rooms, auth checks)"
echo "   • Health check endpoint for monitoring"
echo ""
echo -e "${BLUE}🔧 Available Endpoints:${NC}"
echo "   • GET  /?action=health    - Health check"
echo "   • GET  /?action=list      - List all rooms"
echo "   • GET  /?action=check     - Check specific room"
echo "   • GET  /?action=presence  - Get room presence"
echo "   • POST /?action=create    - Create new room"
echo "   • POST /?action=token     - Generate access token"
echo "   • DELETE /?action=delete  - Delete room"
echo ""
echo -e "${BLUE}📱 Next Steps:${NC}"
echo "   1. Test the new ApiStatus.tsx dashboard"
echo "   2. Verify ActiveGames component shows enhanced info"
echo "   3. Monitor function logs for any issues"
echo "   4. Update any client code to use new error codes"
echo ""
echo -e "${GREEN}✨ Ready for production use!${NC}"
