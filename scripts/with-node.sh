#!/bin/bash
# Helper script to run commands with correct Node.js version

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Use the version specified in .nvmrc
nvm use

# Run the command passed as arguments
exec "$@"
