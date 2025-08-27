#!/bin/bash

# Comprehensive monitoring test script
# Tests both frontend and backend monitoring capabilities

echo "🔍 Starting comprehensive monitoring test..."
echo "=================================="

cd /home/tareq/Desktop/Tahadialthalatheen

# Check if Sentry DSN is set
if [ -z "$SENTRY_DSN" ]; then
    echo "❌ Error: SENTRY_DSN environment variable not set"
    echo "Please export SENTRY_DSN=your_dsn_here"
    exit 1
fi

echo "✅ SENTRY_DSN is set"

# Build the project with monitoring
echo ""
echo "📦 Building project with Sentry monitoring..."
pnpm build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build successful"

# Start the test server in background
echo ""
echo "🚀 Starting test server..."
SENTRY_DSN=$SENTRY_DSN node scripts/serve-with-dsn.js &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Test frontend monitoring with Playwright
echo ""
echo "🎭 Testing frontend monitoring..."
cat > test-monitoring.js << 'EOF'
const { chromium } = require('playwright');

async function testFrontendMonitoring() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console messages and network requests
  const consoleMessages = [];
  const networkRequests = [];

  page.on('console', msg => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`);
  });

  page.on('request', request => {
    networkRequests.push({
      url: request.url(),
      method: request.method(),
      timestamp: new Date().toISOString()
    });
  });

  try {
    console.log('📱 Navigating to application...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    console.log('🎯 Testing Sentry error tracking...');
    await page.click('button:has-text("Break the world")');

    // Wait for error handling
    await page.waitForTimeout(2000);

    // Check for Sentry requests
    const sentryRequests = networkRequests.filter(req =>
      req.url.includes('sentry.io') || req.url.includes('ingest')
    );

    console.log(`📊 Captured ${sentryRequests.length} Sentry requests`);
    console.log(`📝 Captured ${consoleMessages.length} console messages`);

    if (sentryRequests.length > 0) {
      console.log('✅ Frontend monitoring test successful!');
      sentryRequests.forEach((req, index) => {
        console.log(`   ${index + 1}. ${req.method} ${req.url}`);
      });
    } else {
      console.log('❌ No Sentry requests detected');
    }

    console.log('');
    console.log('📱 Testing function monitoring...');

    // Test backend function endpoints
    const functions = [
      'supabase-health',
      'get-sentry-dsn',
      'create-daily-room',
      'game-event'
    ];

    for (const func of functions) {
      try {
        const response = await page.evaluate(async (funcName) => {
          const resp = await fetch(`/.netlify/functions/${funcName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: true })
          });
          return {
            status: resp.status,
            ok: resp.ok,
            data: await resp.json()
          };
        }, func);

        console.log(`   ${func}: ${response.ok ? '✅' : '❌'} (${response.status})`);
      } catch (error) {
        console.log(`   ${func}: ❌ Error - ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testFrontendMonitoring();
EOF

node test-monitoring.js

# Clean up
echo ""
echo "🧹 Cleaning up..."
kill $SERVER_PID 2>/dev/null
rm test-monitoring.js

echo ""
echo "🎉 Monitoring test complete!"
echo "Check your Sentry dashboard for new events."
