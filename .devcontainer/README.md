# GitHub Codespaces Development Container

This configuration sets up a complete development environment for the Thirty Challenge project in GitHub Codespaces.

## What's Included

### Base Environment
- **Node.js 22.17.0** (matches `.nvmrc`)
- **pnpm** package manager (automatically configured)
- **GitHub CLI** for repository management
- **Docker-in-Docker** for containerized workflows

### VS Code Extensions
All recommended extensions from `scripts/install-vscode-extensions.sh` are automatically installed:

- **TypeScript & React**: Advanced TypeScript support, React snippets
- **Code Quality**: ESLint, Prettier formatting
- **Development Tools**: GitLens, GitHub Copilot, Thunder Client
- **Project-Specific**: Tailwind CSS IntelliSense, Supabase extension
- **Documentation**: Markdown support with Mermaid diagrams

### Port Forwarding
Automatic forwarding for common development ports:
- **5173**: Vite development server
- **3000**: Netlify development server
- **8000**: Preview server
- **8080**: Alternative development port

### User Settings Sync
- **Enabled**: Your personal VS Code settings, keybindings, and themes sync automatically
- **Environment Variables**: Properly configured for development

## Usage

1. **Open in Codespaces**: Click "Code" → "Codespaces" → "Create codespace on main"
2. **Automatic Setup**: Dependencies install automatically via `pnpm install`
3. **Start Development**: Run `pnpm dev` to start the Vite development server
4. **Access Application**: Use forwarded port 5173 to access your app

## Development Commands

```bash
# Install dependencies (automatically run on container creation)
pnpm install

# Start development server
pnpm dev

# Start Netlify development (with functions)
pnpm dev:netlify

# Build project
pnpm build

# Run tests
pnpm test

# Type checking
pnpm tsc --noEmit

# Lint code
pnpm lint

# Format code
pnpm format
```

## Configuration Files

- **`.devcontainer/devcontainer.json`**: Main container configuration
- **`.vscode/settings.json`**: Workspace settings optimized for the project
- **`.vscode/extensions.json`**: Recommended extensions list
- **`.vscode/launch.json`**: Debugging configurations
- **`.vscode/tasks.json`**: Common development tasks

## Security

- Environment variables are handled securely
- User settings sync respects privacy settings
- No secrets are committed to the repository

## Troubleshooting

1. **Extensions not loading**: Restart the Codespace or manually install from Extensions panel
2. **pnpm not found**: Run `corepack enable && corepack prepare pnpm@latest --activate`
3. **Port forwarding issues**: Check the Ports panel in VS Code
4. **Git issues**: The safe directory is automatically configured

## Features

- ✅ **User Settings Sync**: Personal configuration preserved
- ✅ **Zero Setup**: Ready to code immediately
- ✅ **Full Stack**: Frontend + Netlify functions support
- ✅ **Debugging**: Chrome and Node.js debugging configured
- ✅ **Testing**: Jest and Playwright test runners
- ✅ **Code Quality**: Automatic linting and formatting
- ✅ **Git Integration**: Full GitHub integration with CLI tools

This setup provides a complete, personalized development environment that matches your local VS Code configuration while ensuring consistency across team members.