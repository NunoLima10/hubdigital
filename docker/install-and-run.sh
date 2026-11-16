#!/bin/sh
set -eu

pnpm install --frozen-lockfile
exec "$@"
