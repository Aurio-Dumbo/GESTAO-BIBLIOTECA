#!/bin/sh
set -e

echo "→ A aplicar migrações Prisma..."
npx prisma migrate deploy

echo "→ A iniciar o servidor..."
exec node dist/app.js
