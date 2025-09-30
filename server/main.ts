import { Application, Router } from "@oak/oak";
import { surveyRouter } from "./routes/surveys.ts";
import { submissionRouter } from "./routes/submissions.ts";

const app = new Application();
const router = new Router();

// CORS 中间件
app.use(async (ctx, next) => {
  ctx.response.headers.set("Access-Control-Allow-Origin", "*");
  ctx.response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  ctx.response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );

  if (ctx.request.method === "OPTIONS") {
    ctx.response.status = 204;
    return;
  }

  await next();
});

// 错误处理中间件
app.use(async (ctx, next) => {
  try {
    await next();
    if (ctx.response.status === 404) {
      ctx.response.status = 404;
      ctx.response.body = { error: "API 端点未找到" };
    }
  } catch (err) {
    console.error("请求处理出错:", err);
    ctx.response.status = 500;
    ctx.response.body = { error: "Server internal error" };
  }
});

// 健康检查端点
router.get("/health", (ctx) => {
  ctx.response.status = 200;
  ctx.response.body = { status: "ok", timestamp: new Date().toISOString() };
});
const apiRouter = new Router();
apiRouter.prefix("/api");
apiRouter.use("/surveys", surveyRouter.routes(), surveyRouter.allowedMethods());
apiRouter.use(
  "/submissions",
  submissionRouter.routes(),
  submissionRouter.allowedMethods(),
);

// 注册路由
app.use(router.routes());
app.use(apiRouter.routes());
app.use(router.allowedMethods());
app.use(apiRouter.allowedMethods());
app.use(async (ctx) => {
  try {
    // 尝试提供静态文件
    await ctx.send({
      root: "./public",
      path: ctx.request.url.pathname,
      index: "index.html"
    });
  } catch {
    // 如果找不到文件，返回 index.html (用于 SPA 路由)
    await ctx.send({
      root: "./public",
      path: "index.html",
    });
  }
});

const PORT = Deno.env.get("PORT") ? Number(Deno.env.get("PORT")) : 8000;

// 启动服务器
async function startServer() {
  console.log("正在启动服务器...");

  // 检查是否使用模拟数据
  const USE_MOCK_DATA = Deno.env.get("USE_MOCK_DATA") === "true";

  if (!USE_MOCK_DATA) {
    console.log("使用数据库连接");
  } else {
    console.log("使用模拟数据模式");
  }

  // 监听端口
  console.log(`服务器运行在 http://0.0.0.0:${PORT}`);
  await app.listen({ port: PORT });
}

// 启动应用
if (import.meta.main) {
  // 优雅关闭处理
  const shutdown = () => {
    console.log("服务器已关闭");
    Deno.exit(0);
  };
  if (Deno.build.os !== "windows") {
    Deno.addSignalListener("SIGINT", shutdown);
    Deno.addSignalListener("SIGTERM", shutdown);
  }

  startServer().catch((error) => {
    console.error("服务器启动失败:", error);
    Deno.exit(1);
  });
}

// 导出用于测试
export { app };
