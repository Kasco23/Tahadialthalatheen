# Node.js Version Management for MCPs

## Problem Overview

VS Code MCPs were using the system Node.js (v18.19.1) instead of NVM-managed Node.js (v20.19.6) because:

1. **GUI applications don't inherit shell environment**: When VS Code is launched from the desktop/GUI, it doesn't load `~/.zshrc` or `~/.bashrc`
2. **MCPs inherit VS Code's environment**: They see whatever Node.js VS Code sees
3. **Project requires Node.js >= 20.19.6**: Per `.nvmrc` and `package.json` engines field

## Solution: Portable NVM Wrapper Scripts

### What Was Implemented

1. **Added NVM to `~/.profile`**: GUI applications now load NVM
2. **Created wrapper scripts**: Portable scripts that dynamically load NVM
3. **Updated MCP config**: All Node.js MCPs now use the wrapper scripts

### Components

#### 1. `~/.profile` NVM Initialization

```bash
# Load NVM (Node Version Manager) for GUI applications
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

#### 2. `~/.local/bin/npx-nvm-wrapper`

Portable wrapper that:

- Loads NVM dynamically
- Respects `.nvmrc` files in the current directory
- Works across different machines and devices
- No hardcoded paths

#### 3. `~/.local/bin/node-nvm-wrapper`

Similar wrapper for direct `node` commands

### Benefits of This Approach

✅ **Portable**: Works on any machine with NVM installed
✅ **Respects `.nvmrc`**: Automatically uses project-specific Node.js versions
✅ **No hardcoded paths**: Uses `$HOME` and NVM's dynamic resolution
✅ **Works across devices**: Same config file works on different machines
✅ **Future-proof**: Automatically picks up new NVM-installed versions

## Verification

Test that the wrapper works:

```bash
~/.local/bin/node-nvm-wrapper --version  # Should show 20.19.6
~/.local/bin/npx-nvm-wrapper --version   # Should show npm version
```

## How to Apply to Other Devices

If you sync your MCP config to another device:

1. **Install NVM** (if not already installed):

   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   ```

2. **Add NVM to `~/.profile`**:

   ```bash
   cat >> ~/.profile << 'EOF'

   # Load NVM (Node Version Manager) for GUI applications
   export NVM_DIR="$HOME/.nvm"
   [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
   EOF
   ```

3. **Create wrapper scripts**:

   ```bash
   # NPX wrapper
   cat > ~/.local/bin/npx-nvm-wrapper << 'EOF'
   #!/bin/bash
   export NVM_DIR="$HOME/.nvm"
   [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
   if [ -f .nvmrc ]; then
       nvm use 2>/dev/null
   fi
   exec npx "$@"
   EOF
   chmod +x ~/.local/bin/npx-nvm-wrapper

   # Node wrapper
   cat > ~/.local/bin/node-nvm-wrapper << 'EOF'
   #!/bin/bash
   export NVM_DIR="$HOME/.nvm"
   [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
   if [ -f .nvmrc ]; then
       nvm use 2>/dev/null
   fi
   exec node "$@"
   EOF
   chmod +x ~/.local/bin/node-nvm-wrapper
   ```

4. **Install required Node.js version**:

   ```bash
   nvm install 20.19.6
   nvm alias default 20.19.6
   ```

5. **Restart VS Code** or re-login for `.profile` changes to take effect

## Troubleshooting

### MCPs still showing wrong Node.js version

1. **Log out and log back in** (to reload `~/.profile`)
2. **Restart VS Code** (Ctrl+Shift+P → "Developer: Reload Window")
3. Verify wrappers exist: `ls -la ~/.local/bin/*nvm-wrapper`

### Wrapper scripts not found

- Ensure `~/.local/bin` is in your PATH
- Check permissions: `chmod +x ~/.local/bin/*nvm-wrapper`

### NVM not loading in wrapper

- Verify NVM is installed: `command -v nvm`
- Check NVM_DIR: `echo $NVM_DIR` (should be `~/.nvm`)
- Test manually: `source ~/.nvm/nvm.sh && nvm --version`

## System Information

- **System Node.js**: v18.19.1 at `/usr/bin/node` (not used by MCPs anymore)
- **NVM Node.js**: v20.19.6 at `~/.nvm/versions/node/v20.19.6/bin/node`
- **Project requires**: Node.js >= 20.19.6
- **NVM Versions Installed**: v20.19.4, v20.19.6 (default), v22.17.0, v22.19.0, v24.3.0, v24.7.0

## MCP Configuration Pattern

All Node.js-based MCPs now follow this pattern:

```json
{
  "ServerName": {
    "command": "$HOME/.local/bin/npx-nvm-wrapper",
    "args": ["package-name"],
    "env": {
      "ENV_VAR": "value"
    },
    "type": "stdio"
  }
}
```

The key is using `$HOME/.local/bin/npx-nvm-wrapper` instead of `npx` directly.
