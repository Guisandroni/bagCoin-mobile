FROM oven/bun:latest

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install

# Copy all files
COPY . .

# Expose port
EXPOSE 3000

# Run dev server
CMD ["bun", "run", "dev"]
