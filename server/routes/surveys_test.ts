// 问卷路由单元测试 - 使用 Test Hooks 和 Steps
import { assertEquals, assertExists } from "@std/assert";
import { stub } from "@std/testing/mock";
import { testing } from "@oak/oak";
import { surveyRouter } from "./surveys.ts";
import { prisma } from "../db.ts";
import { QuestionType, UserRole } from "../types.ts";
import { generateToken } from "../auth.ts";

// 共享的测试数据
let adminUser: any;
let authToken: string;

// 在所有测试前设置
Deno.test.beforeAll(async () => {
  // 模拟管理员用户
  adminUser = {
    id: 1,
    name: "ADMIN",
    id_number: "ADMIN",
    role: UserRole.ADMIN,
    password: "a2ccac6bc029eadbc8caeaff5d6dc232fc2f396265d6dc0778034f7a2ca827ef" // admin123的正确哈希
  };
  
  // 生成真实的JWT token用于测试
  authToken = await generateToken(adminUser.id, adminUser.role);
});

// 公开路由测试组（不需要认证）
Deno.test("Public Routes - 公开路由测试", async (t) => {
  await t.step("GET / - 应该返回分页的问卷列表", async () => {
    const mockSurveys = [
      {
        id: 1,
        title: "测试问卷1",
        description: "描述1",
        year: "2023-2024",
        semester: 1,
        week: 10,
        created_at: new Date("2024-03-15"),
        questions: [],
        _count: { submissions: 5 }
      },
      {
        id: 2,
        title: "测试问卷2",
        description: "描述2",
        year: "2023-2024",
        semester: 2,
        week: 5,
        created_at: new Date("2024-03-20"),
        questions: [],
        _count: { submissions: 3 }
      }
    ];

    using findManyStub = stub(
      prisma.survey,
      "findMany",
      () => Promise.resolve(mockSurveys) as any
    );

    using countStub = stub(
      prisma.survey,
      "count",
      () => Promise.resolve(10) as any
    );

    const ctx = testing.createMockContext({
      path: "/?page=1&limit=10",
      method: "GET",
    });
    
    const middleware = surveyRouter.routes();
    const next = testing.createMockNext();
    await middleware(ctx, next);

    assertEquals(ctx.response.status, 200);
    const body = ctx.response.body as any;
    assertEquals(body.surveys.length, 2);
    assertEquals(body.total, 10);
    assertEquals(body.page, 1);
    assertEquals(body.limit, 10);
  });

  await t.step("GET /:id - 应该返回指定ID的问卷", async () => {
    const mockSurvey = {
      id: 1,
      title: "测试问卷",
      description: "测试描述",
      year: "2023-2024",
      semester: 1,
      week: 10,
      created_at: new Date("2024-03-15"),
      questions: [
        {
          id: 1,
          survey_id: 1,
          description: "问题1",
          config: { type: QuestionType.STAR, maxStars: 5, required: true }
        }
      ]
    };

    using findUniqueStub = stub(
      prisma.survey,
      "findUnique",
      () => Promise.resolve(mockSurvey) as any
    );

    const ctx = testing.createMockContext({
      path: "/1",
      method: "GET",
      params: { id: "1" }
    });

    const middleware = surveyRouter.routes();
    const next = testing.createMockNext();
    await middleware(ctx, next);

    assertEquals(ctx.response.status, 200);
    const body = ctx.response.body as any;
    assertEquals(body.title, "测试问卷");
    assertEquals(body.questions.length, 1);
  });

  await t.step("GET /:id - 问卷不存在时应该返回404", async () => {
    using findUniqueStub = stub(
      prisma.survey,
      "findUnique",
      () => Promise.resolve(null) as any
    );

    const ctx = testing.createMockContext({
      path: "/999",
      method: "GET",
      params: { id: "999" }
    });

    const middleware = surveyRouter.routes();
    const next = testing.createMockNext();
    await middleware(ctx, next);

    assertEquals(ctx.response.status, 404);
    const body = ctx.response.body as any;
    assertEquals(body.error, "问卷不存在");
  });
});

// 受保护路由测试组（需要管理员认证）
Deno.test("Protected Routes - 受保护的管理员路由测试", async (t) => {
  await t.step("POST / - 未授权时应该返回401", async () => {
    const requestBody = {
      title: "新问卷",
      description: "新描述",
      year: "2024-2025",
      semester: 1,
      week: 1,
      questions: []
    };

    const ctx = testing.createMockContext({
      path: "/",
      method: "POST",
      headers: [["content-type", "application/json"]], // 没有authorization header
      body: ReadableStream.from([new TextEncoder().encode(JSON.stringify(requestBody))]),
    });

    const middleware = surveyRouter.routes();
    const next = testing.createMockNext();
    await middleware(ctx, next);

    assertEquals(ctx.response.status, 401);
  });

  await t.step("DELETE /:id - 未授权时应该返回401", async () => {
    const ctx = testing.createMockContext({
      path: "/1",
      method: "DELETE",
      params: { id: "1" },
      headers: [] // 没有authorization header
    });

    const middleware = surveyRouter.routes();
    const next = testing.createMockNext();
    await middleware(ctx, next);

    assertEquals(ctx.response.status, 401);
  });

  await t.step("GET /:id/results - 未授权时应该返回401", async () => {
    const ctx = testing.createMockContext({
      path: "/1/results?page=1&limit=20",
      method: "GET",
      params: { id: "1" },
      headers: [] // 没有authorization header
    });

    const middleware = surveyRouter.routes();
    const next = testing.createMockNext();
    await middleware(ctx, next);

    assertEquals(ctx.response.status, 401);
  });

  await t.step("GET /:id/insights/:questionId - 未授权时应该返回401", async () => {
    const ctx = testing.createMockContext({
      path: "/1/insights/1",
      method: "GET",
      params: { id: "1", questionId: "1" },
      headers: [] // 没有authorization header
    });

    const middleware = surveyRouter.routes();
    const next = testing.createMockNext();
    await middleware(ctx, next);

    assertEquals(ctx.response.status, 401);
  });

});
