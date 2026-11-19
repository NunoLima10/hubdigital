FROM node:24-bookworm-slim

ARG PNPM_VERSION=10.8.0

ENV COREPACK_HOME=/opt/corepack \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    npm_config_store_dir=/pnpm-store

RUN apt-get update \
    && apt-get install --yes --no-install-recommends postgresql-client \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable \
    && corepack prepare "pnpm@${PNPM_VERSION}" --activate \
    && mkdir -p \
        /pnpm-store \
        /workspace/node_modules \
        /workspace/api/node_modules \
        /workspace/web/node_modules \
        /workspace/admin/node_modules \
        /workspace/packages/shared/node_modules \
        /workspace/packages/theme/node_modules \
    && chown -R node:node /opt/corepack /pnpm-store /workspace

USER node
WORKDIR /workspace
