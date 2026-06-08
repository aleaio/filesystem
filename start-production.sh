#!/usr/bin/env bash
set -euo pipefail
cd /etc/project/filesystem
exec /root/.nvm/versions/node/v24.14.0/bin/node \
  /etc/project/filesystem/node_modules/tsx/dist/cli.mjs \
  /etc/project/filesystem/server.ts \
  --production
