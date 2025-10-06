// 认证中间件
import { Context, Next } from "@oak/oak";
import { verifyToken } from "../auth.ts";
import { prisma } from "../db.ts";
import { UserRole } from "../types.ts";

// 需要管理员权限的中间件
export async function needAdminAuthorization(ctx: Context, next: Next) {
  // 从 Authorization header 获取 token
  const authHeader = ctx.request.headers.get("Authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    ctx.response.status = 401;
    ctx.response.body = { error: "未授权：缺少认证信息" };
    return;
  }

  const token = authHeader.substring(7); // 移除 "Bearer " 前缀
  
  // 验证 token
  const payload = await verifyToken(token);
  
  if (!payload) {
    ctx.response.status = 401;
    ctx.response.body = { error: "未授权：无效的认证信息" };
    return;
  }

  // 检查是否是管理员
  if (payload.role !== UserRole.ADMIN) {
    ctx.response.status = 403;
    ctx.response.body = { error: "权限不足：需要管理员权限" };
    return;
  }

  // 从数据库获取用户信息（可选，确保用户仍然存在）
  const user = await prisma.user.findUnique({
    where: { id: payload.userId }
  });

  if (!user) {
    ctx.response.status = 401;
    ctx.response.body = { error: "未授权：用户不存在" };
    return;
  }

  // 将用户信息存入 state
  ctx.state.user = {
    id: user.id,
    name: user.name,
    id_number: user.id_number,
    role: user.role
  };

  await next();
}
