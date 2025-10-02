// Mock Prisma client for testing
// 用于测试的 Mock Prisma 客户端，避免实际数据库连接

export const prisma = {
  survey: {
    findMany: async (_args?: any) => [] as any[],
    findUnique: async (_args?: any) => null as any,
    create: async (_args?: any) => ({}) as any,
    update: async (_args?: any) => ({}) as any,
    delete: async (_args?: any) => ({}) as any,
    count: async (_args?: any) => 0,
  },
  submission: {
    findMany: async (_args?: any) => [] as any[],
    findUnique: async (_args?: any) => null as any,
    create: async (_args?: any) => ({}) as any,
    count: async (_args?: any) => 0,
  },
  user: {
    findFirst: async (_args?: any) => null as any,
    create: async (_args?: any) => ({}) as any,
  },
  question: {
    deleteMany: async (_args?: any) => ({ count: 0 }),
  },
  $connect: async () => {},
  $disconnect: async () => {},
};
