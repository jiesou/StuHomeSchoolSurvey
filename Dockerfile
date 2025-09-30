# -- stage-1 -- client build
FROM node:22-alpine
FROM denoland/deno:2.5.2 AS client-builder

WORKDIR /app/client
COPY client/package*.json ./
COPY client/deno.* ./
RUN deno install

COPY client/ .
RUN deno task build

# -- stage-2 -- server start
FROM denoland/deno:2.5.2 AS server

WORKDIR /app/server

COPY server/package*.json ./
COPY server/deno.* ./
RUN deno install

COPY server/ .
COPY --from=client-builder /app/client/dist/ ./public

# 生成 Prisma 客户端
RUN deno task db:generate

EXPOSE 8000

# 生产服务模式启动
CMD ["deno", "task", "start"]