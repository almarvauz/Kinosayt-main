FROM oven/bun:1 AS builder
WORKDIR /app
COPY package.json bun.lockb* ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/database/package.json ./packages/database/
RUN bun install --frozen-lockfile
COPY apps/api ./apps/api
COPY packages ./packages
RUN cd apps/api && bunx prisma generate

FROM oven/bun:1-slim
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api ./apps/api
COPY --from=builder /app/packages ./packages
WORKDIR /app/apps/api
CMD ["bun", "run", "src/main.ts"]
