FROM node:22-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

RUN apk add --no-cache python3 make g++

COPY pnpm-workspace.yaml nx.json tsconfig.base.json package.json pnpm-lock.yaml ./

COPY apps/frontend ./apps/frontend
COPY packages ./packages

RUN pnpm install --frozen-lockfile

EXPOSE 3000

CMD ["pnpm", "nx", "dev", "frontend"]
