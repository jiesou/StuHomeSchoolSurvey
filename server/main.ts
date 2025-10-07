import { Application, Router } from "@oak/oak";
import { surveyRouter } from "./routes/surveys.ts";
import { submissionRouter } from "./routes/submissions.ts";
import { authRouter } from "./routes/auth.ts";
import { insightsRouter } from "./routes/insights.ts";

const app = new Application();
const router = new Router();

// 日志中间件
app.use(async (ctx, next) => {
  const start = Date.now();
  // 核心：等待所有后续中间件和路由处理完成
  await next(); 
  const end = Date.now();
  const ms = end - start;
  // 1. 获取时间戳，格式化为 [YYYY-MM-DD HH:mm:ss.sss]
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 23);
  // 2. 获取客户端 IP 地址 (使用 Oak 提供的 ctx.request.ip)
  const ip = ctx.request.ip;
  // 3. 获取请求方法和路径
  const method = ctx.request.method;
  const path = ctx.request.url.pathname;
  // 4. 获取响应状态码
  const status = String(ctx.response.status);
  console.log(`[${timestamp}] ${ip} "${method} ${path}" ${status} ${ms}ms`);
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
apiRouter.use("/auth", authRouter.routes(), authRouter.allowedMethods());
apiRouter.use("/surveys", surveyRouter.routes(), surveyRouter.allowedMethods());
apiRouter.use(
  "/submissions",
  submissionRouter.routes(),
  submissionRouter.allowedMethods(),
);
apiRouter.use("/insights", insightsRouter.routes(), insightsRouter.allowedMethods());

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
  console.log("使用数据库连接");
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
