#!/bin/sh

# Xcode Cloud post-clone script
# Installs npm dependencies so Capacitor SPM local packages resolve correctly

echo "Installing Node.js dependencies..."
cd "$CI_PRIMARY_REPOSITORY_PATH"
npm install
echo "Node dependencies installed."
