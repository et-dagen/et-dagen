#!/bin/bash

# Exit on any non-zero status.
set -e

# Define environment variables
export NODE_ENV=production

# Install dependencies
echo "Installing dependencies..."
npm install

# Run linting and testing script
bash lint-test.sh

# TODO: #36 Configure deployment script to Digital Ocean
# Deploy to Digital Ocean
# echo "Deploying to Digital Ocean..."

echo "Deployment completed successfully!"