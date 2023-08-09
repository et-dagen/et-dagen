#!/bin/bash

# Exit on any non-zero status.
set -e

# Lint all files in the project.
echo "Running linting..."
npm run lint

# TODO: #35 Setup component- and composable testing with vitest
# Run test
# echo "Running tests..."
# npm test

# Build app
npm run build

echo "Linting and testing completed successfully!"