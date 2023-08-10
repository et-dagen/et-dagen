#!/bin/bash

# Exit on any non-zero status.
set -e

# Define environment variables
export NODE_ENV=production

# Modify the PATH to include the node_modules/.bin directory
# export PATH="$PATH:$(npm bin)"

# Install dependencies
echo "Installing dependencies..."
npm ci

# Run linting and testing script
./lint-test.sh

# TODO: #36 Configure deployment script to Digital Ocean
# Deploy to Digital Ocean
# echo "Deploying to Digital Ocean..."

echo "Deployment completed successfully!"