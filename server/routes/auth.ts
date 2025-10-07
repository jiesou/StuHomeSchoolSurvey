// 认证相关的 API 路由
import { Router } from "@oak/oak";
import { prisma } from "../db.ts";
import { hashPassword, verifyPassword, generateToken } from "../auth.ts";
import { UserRole } from "../types.ts";

const authRouter = new Router();

// 注册管理员账号
authRouter.post("/register", async (ctx) => {
  try {
    const body = await ctx.request.body.json();
    const { name, id_number, password } = body;

    if (!name || !id_number || !password) {
      ctx.response.status = 400;
      ctx.response.body = { error: "缺少必要字段" };
      return;
    }

    // 检查用户是否已存在（在验证密码前检查，提高效率）
    const existingUser = await prisma.user.findUnique({
      where: { id_number }
    });

    if (existingUser) {
      ctx.response.status = 400;
      ctx.response.body = { error: "用户已存在" };
      return;
    }

    // 验证密码长度
    if (password.length < 6) {
      ctx.response.status = 400;
      ctx.response.body = { error: "密码长度至少为6个字符" };
      return;
    }

    // 哈希密码
    const passwordHash = await hashPassword(password);

    // 创建管理员用户
    const user = await prisma.user.create({
      data: {
        name,
        id_number,
        password: passwordHash,
        role: UserRole.ADMIN
      }
    });

    // 生成 token
    const token = await generateToken(user.id, user.role);

    ctx.response.status = 201;
    ctx.response.body = {
      token,
      user: {
        id: user.id,
        name: user.name,
        id_number: user.id_number,
        role: user.role
      }
    };
  } catch (error) {
    console.error("注册失败:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "注册失败" };
  }
});

// 登录
authRouter.post("/login", async (ctx) => {
  try {
    const body = await ctx.request.body.json();
    const { id_number, password } = body;

    if (!id_number || !password) {
      ctx.response.status = 400;
      ctx.response.body = { error: "缺少必要字段" };
      return;
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { id_number }
    });

    if (!user || !user.password) {
      ctx.response.status = 401;
      ctx.response.body = { error: "用户名或密码错误" };
      return;
    }

    // 验证密码
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      ctx.response.status = 401;
      ctx.response.body = { error: "用户名或密码错误" };
      return;
    }

    // 检查是否是管理员
    if (user.role !== UserRole.ADMIN) {
      ctx.response.status = 403;
      ctx.response.body = { error: "权限不足" };
      return;
    }

    // 生成 token
    const token = await generateToken(user.id, user.role);

    ctx.response.status = 200;
    ctx.response.body = {
      token,
      user: {
        id: user.id,
        name: user.name,
        id_number: user.id_number,
        role: user.role
      }
    };
  } catch (error) {
    console.error("登录失败:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "登录失败" };
  }
});

export { authRouter };
