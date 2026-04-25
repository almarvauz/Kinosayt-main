FROM oven/bun:1 AS builder
WORKDIR /app
COPY package.json bun.lockb* ./
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/
RUN bun install --frozen-lockfile
COPY apps/web ./apps/web
COPY packages ./packages
ENV NEXT_TELEMETRY_DISABLED=1
RUN cd apps/web && bun run build

FROM oven/bun:1-slim
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/packages ./packages
WORKDIR /app/apps/web
CMD ["bun", "run", "start"]
