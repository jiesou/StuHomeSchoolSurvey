FROM node:22-alpine
FROM denoland/deno:2.5.2

WORKDIR /app

COPY server/package*.json ./server/
COPY server/deno.* ./server/
RUN cd server && deno install

COPY client/package*.json ./client/
COPY client/deno.* ./client/
RUN cd client && deno install

COPY client/ ./client/
RUN cd client && deno task build
RUN ln -s /app/client/dist /app/server/public

EXPOSE 8000

WORKDIR /app/server
# 生产服务模式启动
CMD ["deno", "task", "start"]