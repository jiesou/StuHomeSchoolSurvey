import { PrismaClient } from "./prisma/generated/client.ts";

let prisma: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

export async function closePrismaClient() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}