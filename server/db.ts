import { PrismaClient } from "./prisma/generated/client.ts";

// 单例 prisma
export const prisma = new PrismaClient();
prisma.$connect().then(() => {
  console.log("Prisma 数据库连接已建立");
  console.log(`DATABASE_URL: ${Deno.env.get("DATABASE_URL")}`);
}).catch((error) => {
  console.error("Prisma 数据库连接失败:", error);
  console.log(`DATABASE_URL: ${Deno.env.get("DATABASE_URL")}`);
});
