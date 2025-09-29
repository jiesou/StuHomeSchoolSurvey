FROM docker.io/denoland/deno:2.5.2

WORKDIR /app

# Copy dependency files first for better caching
COPY deno.json deno.lock ./
COPY prisma/ ./prisma/

# Cache dependencies
RUN deno install

# Copy application files
COPY . .

# Generate Prisma client
RUN deno run -A --env=.env npm:prisma generate --schema=./prisma/schema.prisma

EXPOSE 8000

CMD ["deno", "run", "-A", "--env", "main.ts"]