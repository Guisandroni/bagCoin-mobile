FROM oven/bun:latest AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install

# Copy all files
COPY . .

# Build for production
ENV NODE_ENV=production
RUN bun run build

# Production stage
FROM oven/bun:latest AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy only necessary files from builder
COPY --from=builder /app/package.json /app/bun.lock ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.* ./

# Install only production dependencies
RUN bun install --production

EXPOSE 3000

CMD ["bun", "run", "start"]
