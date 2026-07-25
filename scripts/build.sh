#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

echo "Installing dependencies..."
NODE_ENV=development corepack pnpm install --prefer-offline --loglevel debug --reporter=append-only

echo "Building the project..."
corepack pnpm exec next build

echo "Build completed successfully!"
