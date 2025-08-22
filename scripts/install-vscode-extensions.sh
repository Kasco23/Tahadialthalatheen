#!/usr/bin/env bash

# VS Code Extensions Installation Script for Thirty Challenge Project
# This script attempts to install recommended VS Code extensions and
# prints marketplace links and fallback info when an extension is built-in
# or fails to install.

set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)

echo "🚀 Installing VS Code Extensions for Thirty Challenge Project..."
echo "================================================="

install() {
	local id="$1"
	local friendly="$2"
	echo "Installing: $friendly -> $id"
	if code --install-extension "$id" >/dev/null 2>&1; then
		echo "  ✅ Installed: $id"
	else
		echo "  ⚠️ Failed to install: $id"
		echo "     → Try searching in VS Code Extensions view (Ctrl+Shift+X) for: $friendly"
		echo "     → Marketplace: https://marketplace.visualstudio.com/search?term=$friendly"
	fi
}

echo "\n📦 TypeScript & Tailwind tooling"
install "ms-vscode.vscode-typescript-next" "TypeScript Next"
install "bradlc.vscode-tailwindcss" "Tailwind CSS IntelliSense"
install "formulahendry.auto-rename-tag" "Auto Rename Tag"

echo "\n⚛️ React & JavaScript snippets"
install "dsznajder.es7-react-js-snippets" "ES7+ React/Redux/React-Native snippets"
install "xabikos.JavaScriptSnippets" "JavaScript (ES6) code snippets"
install "burkeholland.simple-react-snippets" "Simple React Snippets"

echo "\n✨ Code quality & formatting"
install "esbenp.prettier-vscode" "Prettier - Code formatter"
install "dbaeumer.vscode-eslint" "ESLint"

echo "\n🛠️ Development helpers"
# Thunder Client is rangav.vscode-thunder-client on the Marketplace (lightweight REST client)
install "rangav.vscode-thunder-client" "Thunder Client"
install "humao.rest-client" "REST Client"
install "ritwickdey.LiveServer" "Live Server"

echo "\n🧪 Testing & test explorer"
# Jest extension can appear as Orta.vscode-jest in the marketplace
install "Orta.vscode-jest" "Jest"
install "hbenl.vscode-test-explorer" "Test Explorer UI"

echo "\n� Git & code intelligence"
install "eamodio.gitlens" "GitLens — Git supercharged"
install "github.vscode-pull-request-github" "GitHub Pull Requests and Issues"
install "github.copilot" "GitHub Copilot"
install "github.copilot-chat" "GitHub Copilot Chat"

echo "\n🔎 Productivity & navigation"
# Outline and NPM Scripts are built into modern VS Code; print guidance instead
echo "Note: 'Outline' and 'NPM Scripts' views are built into VS Code. Open View -> Outline or NPM Scripts explorer."
install "alefragnani.bookmarks" "Bookmarks"
install "gruntfuggly.todo-tree" "Todo Tree"
install "christian-kohler.path-intellisense" "Path Intellisense"
install "mrmlnc.vscode-duplicate" "Duplicate action"

echo "\n🗄️ Database & Supabase"
# Official Supabase extension id on marketplace: Supabase.vscode-supabase-extension
install "Supabase.vscode-supabase-extension" "Supabase"

echo "\n📝 Markdown & docs"
install "yzhang.markdown-all-in-one" "Markdown All in One"
install "bierner.markdown-mermaid" "Markdown Preview Mermaid Support"
install "davidanson.vscode-markdownlint" "markdownlint"

echo "\n========== Summary & Next Steps =========="
echo "1) Restart VS Code to ensure extensions are loaded"
echo "2) If any extension failed, open VS Code Extensions (Ctrl+Shift+X) and search by the friendly name above"
echo "3) Built-in features: JSON language, Outline, NPM Scripts and JS Debugging are typically built into recent VS Code releases"
echo "   - JSON features: https://code.visualstudio.com/docs/languages/json"
echo "   - JS Debugging: https://code.visualstudio.com/docs/nodejs/debugging-recipes"
echo "4) To install manually from a browser, visit the Marketplace search page and search the friendly name (or publisher+name). Example: https://marketplace.visualstudio.com/search?term=Thunder+Client"
echo "5) For Copilot & GitHub extensions you may need to sign in (Command Palette -> 'GitHub: Sign in') and accept any subscription prompts"
echo "6) Recommended: restart and check Extensions view for any failed installs, then install manually as needed"

echo "\nIf you want, I can:"
echo " - update this script further with exact marketplace URLs per extension"
echo " - create a small README snippet with manual install steps and exact search terms"
echo " - attempt to detect 'code' CLI availability and hint how to install it (if missing)"

echo "================================================="
