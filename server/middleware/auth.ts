// 管理员鉴权中间件
import { Context, Next } from "@oak/oak";

// 验证管理员权限
export async function needAdminAuthorization(ctx: Context, next: Next) {
  const adminSecret = Deno.env.get("ADMIN_SECRET");
  
  if (!adminSecret) {
    console.error("ADMIN_SECRET 环境变量未设置");
    ctx.response.status = 500;
    ctx.response.body = { error: "服务器配置错误" };
    return;
  }

  const authHeader = ctx.request.headers.get("Authorization");
  
  if (!authHeader || authHeader !== adminSecret) {
    ctx.response.status = 401;
    ctx.response.body = { error: "未授权访问" };
    return;
  }

  await next();
}
