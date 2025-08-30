# GitHub Copilot Web MCP Setup Guide

This guide will help you configure Model Context Protocol (MCP) servers for GitHub Copilot web using your existing VS Code MCP configuration. GitHub Copilot web can leverage the same powerful MCP servers you use in VS Code, providing enhanced capabilities for coding assistance.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Setting up GitHub Repository Configuration](#setting-up-github-repository-configuration)
3. [Converting Your VS Code MCP Config](#converting-your-vs-code-mcp-config)
4. [Setting up Environment Secrets](#setting-up-environment-secrets)
5. [Server-Specific Configuration](#server-specific-configuration)
6. [Validation and Testing](#validation-and-testing)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

Before setting up MCP servers for GitHub Copilot web:

1. **Repository Admin Access**: You must be a repository administrator
2. **GitHub Enterprise Cloud**: MCP support requires GitHub Enterprise Cloud
3. **Copilot License**: Active GitHub Copilot license
4. **Understanding of MCP**: Read [MCP and GitHub Copilot coding agent concepts](https://docs.github.com/en/enterprise-cloud@latest/copilot/concepts/coding-agent/mcp-and-coding-agent)

⚠️ **Important**: Once configured, Copilot will use MCP tools autonomously without asking for approval.

## Setting up GitHub Repository Configuration

### Step 1: Navigate to Repository Settings

1. Go to your repository on GitHub.com
2. Click the **Settings** tab (if not visible, click the **⋯** dropdown menu → **Settings**)
3. In the left sidebar under "Code & automation", click **Copilot** → **Coding agent**
4. Find the **MCP configuration** section

### Step 2: Create Copilot Environment for Secrets

1. In the left sidebar, click **Environments**
2. Click **New environment**
3. Name it exactly `copilot`
4. Click **Configure environment**

This environment will store your API keys and access tokens securely.

## Converting Your VS Code MCP Config

Your current VS Code configuration needs to be adapted for GitHub Copilot web. Here's the converted configuration based on your `mcp.json`:

### GitHub Copilot Web MCP Configuration

```json
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/",
      "tools": ["*"]
    },
    "playwright": {
      "type": "local",
      "command": "npx",
      "args": ["@playwright/mcp@latest"],
      "tools": ["*"]
    },
    "microsoft-docs": {
      "type": "http",
      "url": "https://learn.microsoft.com/api/mcp",
      "tools": ["*"]
    },
    "sequentialthinking": {
      "type": "local",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"],
      "tools": ["*"]
    },
    "memory": {
      "type": "local",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "env": {
        "MEMORY_FILE_PATH": "/tmp/copilot-memory.json"
      },
      "tools": ["*"]
    },
    "firecrawl": {
      "type": "local",
      "command": "npx",
      "args": ["-y", "firecrawl-mcp"],
      "env": {
        "FIRECRAWL_API_KEY": "COPILOT_MCP_FIRECRAWL_API_KEY"
      },
      "tools": ["crawl", "scrape", "search"]
    },
    "human-in-the-loop": {
      "type": "local",
      "command": "uvx",
      "args": ["hitl-mcp-server"],
      "tools": ["*"]
    },
    "reactbits": {
      "type": "local",
      "command": "npx",
      "args": ["reactbits-dev-mcp-server"],
      "tools": ["*"]
    },
    "supabase": {
      "type": "local",
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--read-only",
        "--project-ref=zgvmkjefgdabumvafqch"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "COPILOT_MCP_SUPABASE_ACCESS_TOKEN"
      },
      "tools": ["*"]
    }
  }
}
```

### Key Changes from VS Code Config

1. **Added `tools` array**: Specifies which tools Copilot can use
2. **Removed `inputs`**: Replaced with direct `env` variables
3. **Updated environment variables**: All secrets now reference `COPILOT_MCP_*` prefixed secrets
4. **Simplified paths**: Removed complex input references

## Setting up Environment Secrets

For each MCP server that requires API keys or tokens, you need to add secrets to your Copilot environment.

### Step 1: Access Copilot Environment

1. In your repository, go to **Settings** → **Environments**
2. Click on the `copilot` environment you created
3. Under "Environment secrets", click **Add environment secret**

### Step 2: Add Required Secrets

Add these secrets with their corresponding values:

#### Firecrawl API Key

- **Secret Name**: `COPILOT_MCP_FIRECRAWL_API_KEY`
- **Where to get it**: [Firecrawl Dashboard](https://www.firecrawl.dev/app/api-keys)
- **Steps**:
  1. Sign up/login to Firecrawl
  2. Go to API Keys section
  3. Create a new API key
  4. Copy the key value

#### Supabase Access Token

- **Secret Name**: `COPILOT_MCP_SUPABASE_ACCESS_TOKEN`
- **Where to get it**: [Supabase Dashboard](https://supabase.com/dashboard/account/tokens)
- **Steps**:
  1. Go to Supabase Dashboard
  2. Click your profile → Account Settings
  3. Go to "Access Tokens" tab
  4. Click "Generate new token"
  5. Give it a name and appropriate scopes
  6. Copy the token

#### Optional: Custom GitHub Token (for broader access)

- **Secret Name**: `COPILOT_MCP_GITHUB_PERSONAL_ACCESS_TOKEN`
- **Where to get it**: GitHub Settings → Developer settings → Personal access tokens
- **Steps**:
  1. Go to GitHub Settings
  2. Developer settings → Personal access tokens → Fine-grained tokens
  3. Generate new token
  4. Select repositories and permissions
  5. Copy the token

## Server-Specific Configuration

### Servers Requiring Dependencies

Some servers need additional setup. Create `.github/workflows/copilot-setup-steps.yml`:

```yaml
on:
  workflow_dispatch:

permissions:
  id-token: write
  contents: read

jobs:
  copilot-setup-steps:
    runs-on: ubuntu-latest
    environment: copilot
    steps:
      # Install uv for Python servers (human-in-the-loop)
      - name: Install uv
        run: |
          curl -LsSf https://astral.sh/uv/install.sh | sh
          echo "$HOME/.cargo/bin" >> $GITHUB_PATH

      # Install any additional dependencies
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
```

### Individual Server Notes

#### 1. GitHub Server

- **Built-in**: Enabled by default
- **Access**: Read-only to current repository
- **Custom token**: Add `COPILOT_MCP_GITHUB_PERSONAL_ACCESS_TOKEN` for broader access

#### 2. Playwright Server

- **Purpose**: Browser automation and testing
- **No secrets required**
- **Tools**: Page navigation, screenshot, form filling

#### 3. Microsoft Docs Server

- **Purpose**: Search Microsoft documentation
- **No secrets required**
- **Tools**: Documentation search and retrieval

#### 4. Sequential Thinking Server

- **Purpose**: Complex problem-solving workflows
- **No secrets required**
- **Tools**: Multi-step reasoning, thought chains

#### 5. Memory Server

- **Purpose**: Persistent memory across conversations
- **Storage**: Uses `/tmp/copilot-memory.json` in GitHub Actions runner
- **No secrets required**

#### 6. Firecrawl Server

- **Purpose**: Web scraping and crawling
- **Requires**: `COPILOT_MCP_FIRECRAWL_API_KEY`
- **Tools**: Limited to crawl, scrape, search for safety

#### 7. Human-in-the-Loop Server

- **Purpose**: Interactive prompts and confirmations
- **Requires**: `uv` installation (add to setup steps)
- **No secrets required**

#### 8. ReactBits Server

- **Purpose**: React component library access
- **No secrets required**
- **Tools**: Component search and code generation

#### 9. Supabase Server

- **Purpose**: Database operations and queries
- **Requires**: `COPILOT_MCP_SUPABASE_ACCESS_TOKEN`
- **Mode**: Read-only for safety
- **Project**: Pre-configured for your project

## Validation and Testing

### Step 1: Save Configuration

1. Paste the MCP configuration JSON into the MCP configuration section
2. Click **Save**
3. Verify no syntax errors are reported

### Step 2: Test with an Issue

1. Create a new issue in your repository
2. Assign the issue to **@copilot**
3. Wait for the 👀 reaction (a few seconds)
4. Wait for Copilot to create a pull request
5. Click the PR link in the issue timeline

### Step 3: Check MCP Server Logs

1. Wait for "Copilot started work" timeline event
2. Click **View session** to open logs
3. Click **⋯** → **Copilot** in sidebar
4. Expand **Start MCP Servers** step
5. Verify your MCP servers and their tools are listed

### Step 4: Test Functionality

Try prompts that would use your MCP servers:

- "Search Microsoft docs for Azure deployment"
- "Use Playwright to test the login form"
- "Query our Supabase database for user statistics"
- "Scrape the latest blog posts from our website"

## Troubleshooting

### Common Issues

#### 1. MCP Server Failed to Start

- **Check**: Dependencies in `copilot-setup-steps.yml`
- **Solution**: Add required installation steps

#### 2. Authentication Errors

- **Check**: Secret names start with `COPILOT_MCP_`
- **Check**: Secrets are added to `copilot` environment
- **Solution**: Verify secret values and permissions

#### 3. Tools Not Available

- **Check**: `tools` array in configuration
- **Solution**: Use `["*"]` to enable all tools or specify exact tool names

#### 4. JSON Syntax Errors

- **Check**: Remove comments from configuration
- **Check**: Proper JSON formatting
- **Solution**: Validate JSON before saving

### Debug Steps

1. **Check GitHub Actions logs** for setup step failures
2. **Verify environment secrets** are properly named and scoped
3. **Test individual tools** with specific prompts
4. **Review Copilot session logs** for detailed error messages

### Getting Help

- [GitHub Community Discussions](https://github.com/orgs/community/discussions)
- [GitHub Support](https://support.github.com/)
- [Copilot Documentation](https://docs.github.com/en/copilot)

## Security Considerations

1. **Read-only tools preferred**: Avoid tools that can modify external systems
2. **Scope API tokens**: Use minimal required permissions
3. **Regular rotation**: Rotate API keys and tokens regularly
4. **Monitor usage**: Review Copilot session logs for unexpected tool usage

## Next Steps

After successful setup:

1. **Customize tool selection**: Refine `tools` arrays for each server
2. **Add more servers**: Explore additional MCP servers for your workflow
3. **Create workflows**: Set up more complex `copilot-setup-steps.yml` for advanced dependencies
4. **Monitor and optimize**: Track MCP server usage and performance

---

This configuration transforms your VS Code MCP setup into a powerful GitHub Copilot web environment, giving you the same advanced capabilities directly in your GitHub workflow.
