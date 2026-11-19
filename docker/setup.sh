#!/bin/sh
set -eu

pnpm install --frozen-lockfile
pnpm shared:build
pnpm api:db:migrate

user_count=$(psql "$DATABASE_URL" -Atc 'select count(*) from users')

if [ "$user_count" = "0" ]; then
  pnpm api:db:seed
  exit 0
fi

echo "Database already has users; seeding reference data only. Run 'docker compose exec api pnpm api:db:seed' for the development fixtures."
pnpm --filter @hubdigital/api exec tsx --env-file .env src/scripts/seed-production.ts
