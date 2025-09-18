FROM node:22-alpine

WORKDIR /app

# Enable pnpm via corepack (pnpm 9 per repo config)
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Copy only manifests for better install caching in image layers
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json

# Install workspace dependencies
RUN pnpm install

# Default command for development (actual source will be bind-mounted by compose)
CMD ["sh", "-c", "pnpm install && pnpm --filter web dev"]


