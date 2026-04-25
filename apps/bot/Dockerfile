FROM oven/bun:1-slim
WORKDIR /app
COPY package.json bun.lockb* ./
COPY apps/bot/package.json ./apps/bot/
COPY packages/types/package.json ./packages/types/
RUN bun install --frozen-lockfile
COPY apps/bot ./apps/bot
COPY packages ./packages
WORKDIR /app/apps/bot
CMD ["bun", "run", "src/index.ts"]
