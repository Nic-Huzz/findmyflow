#!/bin/sh

# Xcode Cloud post-clone script
# Installs Node.js + npm dependencies so Capacitor SPM local packages resolve

echo "Installing Node.js via Homebrew..."
export HOMEBREW_NO_AUTO_UPDATE=1
brew install node
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"

echo "Installing npm dependencies..."
cd "$CI_PRIMARY_REPOSITORY_PATH"
npm install
echo "Node dependencies installed."
