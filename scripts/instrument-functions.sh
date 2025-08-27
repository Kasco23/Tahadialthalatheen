#!/bin/bash

# List of TypeScript functions to instrument with Sentry
FUNCTIONS=(
    "batch-check-rooms.ts"
    "check-daily-room.ts"
    "create-daily-token.ts"
    "daily-diagnostics.ts"
    "delete-daily-room.ts"
    "get-room-presence.ts"
)

cd /home/tareq/Desktop/Tahadialthalatheen/netlify/functions

for func in "${FUNCTIONS[@]}"; do
    echo "Processing $func..."

    # Check if file exists
    if [[ ! -f "$func" ]]; then
        echo "  File $func not found, skipping..."
        continue
    fi

    # Get function name without extension
    func_name=$(basename "$func" .ts)

    # Skip if already instrumented
    if grep -q "withSentry" "$func"; then
        echo "  $func already instrumented, skipping..."
        continue
    fi

    # Create backup
    cp "$func" "${func}.backup"

    # Add imports at the top (after existing imports)
    sed -i '1a const { withSentry, createApiResponse } = require('\''./_sentry.js'\'');' "$func"

    # Replace handler export pattern
    # Look for: export const handler: Handler = async (event) => {
    # Replace with named handler and then wrap with withSentry
    sed -i "s/export const handler.*async (event.*{/const ${func_name}Handler = async (event, _context) => {/" "$func"

    # Add the wrapped export at the end (before the last closing brace)
    sed -i '$i\\n// Export with Sentry monitoring\nexport const handler = withSentry('"'$func_name'"', '"$func_name"'Handler);' "$func"

    echo "  $func instrumented successfully"
done

echo "Batch instrumentation complete!"
