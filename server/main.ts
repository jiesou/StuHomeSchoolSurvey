import { Application, Router } from "@oak/oak";
import * as log from "@std/log";
import { getPrismaClient, closePrismaClient } from "./database.ts";
import { surveyRoutes } from "./routes/surveys.ts";
import { userRoutes } from "./routes/users.ts";

// Configure logging
await log.setup({
  handlers: {
    console: new log.ConsoleHandler("INFO"),
  },
  loggers: {
    default: {
      level: "INFO",
      handlers: ["console"],
    },
  },
});

const app = new Application();
const router = new Router();

// CORS middleware
app.use(async (ctx, next) => {
  ctx.response.headers.set("Access-Control-Allow-Origin", "*");
  ctx.response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  ctx.response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  if (ctx.request.method === "OPTIONS") {
    ctx.response.status = 200;
    return;
  }
  
  await next();
});

// Error handling middleware
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    log.error(`Error handling ${ctx.request.method} ${ctx.request.url}: ${error.message}`);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error" };
  }
});

// Request logging
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  log.info(`${ctx.request.method} ${ctx.request.url} - ${ctx.response.status} - ${ms}ms`);
});

// Health check
router.get("/health", (ctx) => {
  ctx.response.body = { status: "ok", timestamp: new Date().toISOString() };
});

// API routes
router.use("/api/surveys", surveyRoutes.routes(), surveyRoutes.allowedMethods());
router.use("/api/users", userRoutes.routes(), userRoutes.allowedMethods());

app.use(router.routes());
app.use(router.allowedMethods());

const port = parseInt(Deno.env.get("PORT") || "8000");

// Graceful shutdown
Deno.addSignalListener("SIGINT", async () => {
  log.info("Shutting down server...");
  await closePrismaClient();
  Deno.exit();
});

log.info(`Server starting on port ${port}`);
await app.listen({ port });

export { getPrismaClient };
