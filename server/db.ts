import { PrismaPg } from 'npm:@prisma/adapter-pg'
import { PrismaClient } from "./prisma/generated/client.ts";

const connectionString = `${Deno.env.get("DATABASE_URL")}`
const adapter = new PrismaPg({ connectionString });
// 单例 prisma
export const prisma = new PrismaClient({ adapter });
prisma.$connect().then(() => {
  console.log("Prisma 数据库连接已建立");
  console.log(`DATABASE_URL: ${Deno.env.get("DATABASE_URL")}`);
}).catch((error) => {
  console.error("Prisma 数据库连接失败:", error);
  console.log(`DATABASE_URL: ${Deno.env.get("DATABASE_URL")}`);
});
