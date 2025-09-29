// 数据库服务模块
import { PrismaClient } from "./prisma/generated/client.ts";

// 使用单例模式确保只有一个 Prisma 客户端实例
let prisma: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
  }
  return prisma;
}

export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

// 初始化数据库连接测试
export async function testConnection(): Promise<boolean> {
  try {
    const client = getPrisma();
    await client.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('数据库连接失败:', error);
    return false;
  }
}