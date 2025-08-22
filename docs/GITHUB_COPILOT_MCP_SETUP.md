# GitHub Copilot Web MCP Setup Guide

This guide explains how to configure Model Context Protocol (MCP) servers for GitHub Copilot Web coding agent.

## Overview

GitHub Copilot Web supports MCP servers to extend its capabilities with external tools and services. This repository is configured with several MCP servers for enhanced development workflows.

## MCP Servers Configured

1. **Context7** - Library documentation and code examples
2. **Sequential Thinking** - Advanced problem-solving and planning
3. **Memory** - Knowledge graph for project context
4. **Playwright** - Web automation and testing
5. **ImageSorcery** - Image processing and manipulation
6. **Firecrawl** - Web scraping and content extraction (requires API key)

## Setup Instructions

### Step 1: Repository Settings

1. Navigate to your repository on GitHub
2. Go to **Settings** → **Copilot** → **Coding agent**
3. In the **MCP configuration** section, paste the following JSON:

```json
{
  "mcpServers": {
    "context7": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"],
      "tools": ["*"]
    },
    "sequentialthinking": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"],
      "tools": ["*"]
    },
    "memory": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "env": {
        "MEMORY_FILE_PATH": "/tmp/copilot-memory.json"
      },
      "tools": ["*"]
    },
    "playwright": {
      "type": "stdio",
      "command": "npx",
      "args": ["@playwright/mcp@latest"],
      "tools": ["*"]
    },
    "imagesorcery": {
      "type": "stdio",
      "command": "uvx",
      "args": ["imagesorcery-mcp"],
      "tools": ["*"]
    },
    "firecrawl": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "firecrawl-mcp"],
      "env": {
        "FIRECRAWL_API_KEY": "$COPILOT_MCP_FIRECRAWL_API_KEY"
      },
      "tools": ["*"]
    }
  }
}
```

4. Click **Save**

### Step 2: Configure Secrets (If Required)

Some MCP servers require API keys or secrets. To set these up:

1. In your repository settings, go to **Environments**
2. Click **New environment**
3. Name it `copilot` and click **Configure environment**
4. Under **Environment secrets**, click **Add environment secret**

#### Required Secrets

For Firecrawl MCP server:

- **Name**: `COPILOT_MCP_FIRECRAWL_API_KEY`
- **Value**: Your Firecrawl API key from https://www.firecrawl.dev/app/api-keys

**Important**: All secret names must start with `COPILOT_MCP_` prefix.

### Step 3: Validate Configuration

1. Create a test issue in your repository
2. Assign the issue to **@copilot**
3. Wait for Copilot to react with 👀 and create a pull request
4. Click the pull request and wait for "Copilot started work" timeline event
5. Click **View session** to open the Copilot coding agent logs
6. Click the ellipsis (...) → **Copilot** → **Start MCP Servers**
7. Verify that your MCP servers are listed and started successfully

## Configuration Differences: VS Code vs Web

### VS Code Configuration

- Uses `mcp.json` file with `inputs` for interactive prompts
- Supports `${input:variable_name}` syntax for secure input
- Can use `envFile` to load environment variables

### GitHub Copilot Web Configuration

- Uses `mcpServers` object in repository settings
- Must use `env` directly instead of `inputs`
- Secrets must be prefixed with `COPILOT_MCP_`
- Requires `tools: ["*"]` to specify available tools

## Common Issues and Solutions

### Issue: MCP Server Failed to Start

- **Solution**: Check that all required dependencies are installed in the GitHub Actions runner
- **Action**: Update `.github/workflows/copilot-setup-steps.yml` with necessary installations

### Issue: Secret Not Found

- **Solution**: Ensure secret name starts with `COPILOT_MCP_` prefix
- **Action**: Verify the secret is added to the `copilot` environment

### Issue: Python MCP Servers Not Working

- **Solution**: Install Python dependencies in setup workflow
- **Action**: The workflow includes `uv` and `pipx` installation for Python MCP servers

## MCP Server Details

### Context7

- **Purpose**: Access library documentation and code examples
- **No API Key Required**

### Sequential Thinking

- **Purpose**: Advanced problem-solving with step-by-step reasoning
- **No API Key Required**

### Memory

- **Purpose**: Persistent knowledge graph for project context
- **Configuration**: Uses `/tmp/copilot-memory.json` for storage

### Playwright

- **Purpose**: Web automation, browser testing, and interaction
- **Dependencies**: Requires Playwright browsers (installed in workflow)

### ImageSorcery

- **Purpose**: Image processing and manipulation
- **Dependencies**: Requires Python with `uv` package manager

### Firecrawl

- **Purpose**: Web scraping and content extraction
- **API Key Required**: Sign up at https://www.firecrawl.dev/

## Best Practices

1. **Start Small**: Begin with servers that don't require API keys
2. **Test Incrementally**: Add one MCP server at a time and validate
3. **Monitor Logs**: Always check the Copilot session logs for issues
4. **Secure Secrets**: Never hardcode API keys in configuration
5. **Update Dependencies**: Keep MCP server packages up to date

## Support and Troubleshooting

- Review Copilot session logs for detailed error messages
- Check GitHub Actions workflow runs for setup issues
- Verify environment secrets are properly configured
- Ensure the `copilot-setup-steps.yml` workflow includes all necessary dependencies

For more information, see the [official GitHub documentation](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/extend-coding-agent-with-mcp).
