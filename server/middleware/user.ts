// 用户相关中间件
import { Context } from "@oak/oak";
import { prisma } from "../db.ts";
import { UserRole } from "../types.ts";

// 查找或创建用户的中间件
export async function ensureUserExists(
  ctx: Context,
  userData: { name: string; id_number: string }
): Promise<{ id: number; name: string; id_number: string; role: number } | null> {
  // 查找用户
  let user = await prisma.user.findUnique({
    where: {
      id_number: userData.id_number,
    },
  });

  if (!user) {
    try {
      // 创建新用户
      user = await prisma.user.create({
        data: {
          name: userData.name,
          id_number: userData.id_number,
          role: UserRole.STUDENT,
        },
      });
    } catch (createError: any) {
      // 处理学号重复的情况（可能是并发创建）
      if (createError.code === 'P2002') {
        ctx.response.status = 400;
        ctx.response.body = { error: "该学号已被其他用户使用，请核实学号和姓名" };
        return null;
      }
      throw createError;
    }
  } else if (user.name !== userData.name) {
    // 学号存在但姓名不匹配
    ctx.response.status = 400;
    ctx.response.body = { error: "学号和姓名不匹配，请核实您的学号和姓名" };
    return null;
  }

  return user;
}
