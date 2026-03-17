#!/bin/sh
set -e

DB_PATH="/app/data/logopro.db"

if [ ! -f "$DB_PATH" ]; then
  echo "Database not found, creating from template..."
  cp /app/prisma/template.db "$DB_PATH"
  echo "Database created successfully."
else
  echo "Database already exists, skipping init."
fi

exec "$@"
