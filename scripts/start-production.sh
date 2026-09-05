#!/bin/sh
set -eu

echo "Applying database migrations..."
./node_modules/.bin/prisma migrate deploy

if [ "${RUN_BOOTSTRAP_SEED:-false}" = "true" ]; then
  echo "Ensuring the bootstrap administrator exists..."
  ./node_modules/.bin/tsx prisma/seed.ts
fi

echo "Starting Olanjay School Platform..."
exec node server.js
