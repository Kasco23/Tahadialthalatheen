#!/bin/bash

# Supabase CLI setup script for GitHub Codespaces
# This script automatically authenticates and links the Supabase project

set -e

echo "🔧 Setting up Supabase CLI..."

# Check if required environment variables are present
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "❌ SUPABASE_ACCESS_TOKEN is not set in Codespace secrets"
    echo "ℹ️  Please add SUPABASE_ACCESS_TOKEN to your Codespace secrets"
    exit 1
fi

if [ -z "$SUPABASE_PROJECT_REF" ]; then
    echo "❌ SUPABASE_PROJECT_REF is not set in Codespace secrets"
    echo "ℹ️  Please add SUPABASE_PROJECT_REF to your Codespace secrets"
    exit 1
fi

# Login to Supabase CLI using the access token
echo "🔐 Logging into Supabase CLI..."
supabase login --token "$SUPABASE_ACCESS_TOKEN"

# Link to the project
echo "🔗 Linking to Supabase project: $SUPABASE_PROJECT_REF"
supabase link --project-ref "$SUPABASE_PROJECT_REF"

# Verify the setup
echo "✅ Supabase CLI setup complete!"
echo "📋 Project status:"
supabase status --output pretty

# Create .env file if it doesn't exist and populate with project-specific URLs
if [ ! -f .env ]; then
    echo "📝 Creating .env file with project configuration..."
    
    # Get project URL from the linked project
    PROJECT_URL="https://${SUPABASE_PROJECT_REF}.supabase.co"
    
    # Create .env file based on .env.example
    cp .env.example .env
    
    # Update the .env file with actual project URL
    sed -i "s|https://your-project-id.supabase.co|$PROJECT_URL|g" .env
    
    echo "✨ Created .env file with project URL: $PROJECT_URL"
    echo "⚠️  You still need to add VITE_SUPABASE_ANON_KEY to your .env file"
    echo "   Get it from: https://supabase.com/dashboard/project/$SUPABASE_PROJECT_REF/settings/api"
else
    echo "ℹ️  .env file already exists - not overwriting"
fi

echo ""
echo "🎉 Supabase setup complete! You can now:"
echo "   • Run 'supabase status' to see local development status"
echo "   • Run 'supabase start' to start local development"
echo "   • Run 'supabase db push' to push schema changes"
echo "   • Run 'supabase db pull' to pull remote schema changes"
echo ""
echo "📖 Don't forget to set VITE_SUPABASE_ANON_KEY in your .env file!"