#!/bin/bash

echo "🔍 Checking if dev server is running..."

# Wait for server to be ready
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Server is ready!"
    break
  fi
  ATTEMPT=$((ATTEMPT + 1))
  echo "⏳ Waiting for server... ($ATTEMPT/$MAX_ATTEMPTS)"
  sleep 1
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
  echo "❌ Server not ready after 30 seconds"
  echo "Please make sure 'pnpm dev' is running in another terminal"
  exit 1
fi

echo ""
echo "🧪 Testing AI Question Generation..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

curl -s -X POST http://localhost:3000/api/generate-ai-question \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Name players who lost a European Cup Final last season (clubs only). Include ALL players who either started OR were on the bench. UEFA Champions League, Europa League, Conference League. Last season = 2024/2025",
    "generatedBy": "test-user",
    "segment": "WDYK"
  }' | jq -r '
    if .error then
      "❌ ERROR: \(.error)\n\nDetails: \(.details // "No additional details")"
    else
      "✅ SUCCESS!\n\n📋 Question: \(.question)\n\n👥 Total Players: \(.answers | length)\n\n💾 Question ID: \(.questionId)\n\n📊 Metadata:\n  - AI Model: \(.metadata.ai_model)\n  - Provider: \(.metadata.provider)\n  - Generation Time: \(.metadata.generation_time_ms)ms\n  - Total Answers: \(.metadata.total_answers)\n\n🎯 First 5 Players:"
    end
  '

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
