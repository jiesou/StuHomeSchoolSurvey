// 问卷路由单元测试 - 使用 Test Hooks 和 Steps
import { assertEquals, assertExists } from "@std/assert";
import { stub } from "@std/testing/mock";
import { testing } from "@oak/oak";
import { surveyRouter } from "./surveys.ts";
import { prisma } from "../db.ts";
import { QuestionType, UserRole } from "../types.ts";
import { generateToken, hashPassword } from "../auth.ts";

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
  await t.step("setup - 准备认证数据", async () => {
    // 这个step只是为了说明测试准备，实际准备在各个具体step中进行
  });

  await t.step("POST / - 应该成功创建问卷", async () => {
    // 在step内部准备admin用户和token，缩小mock范围
    const passwordHash = await hashPassword("admin123");
    const adminUser = {
      id: 1,
      name: "ADMIN",
      id_number: "ADMIN",
      role: UserRole.ADMIN,
      password: passwordHash
    };
    const authToken = await generateToken(adminUser.id, adminUser.role);

    const mockCreatedSurvey = {
      id: 3,
      title: "新问卷",
      description: "新描述",
      year: "2024-2025",
      semester: 1,
      week: 1,
      created_at: new Date(),
      questions: [
        {
          id: 10,
          survey_id: 3,
          description: "新问题",
          config: { type: QuestionType.INPUT, required: true }
        }
      ]
    };

    using createStub = stub(
      prisma.survey,
      "create",
      () => Promise.resolve(mockCreatedSurvey) as any
    );

    using findUniqueStub = stub(
      prisma.user,
      "findUnique",
      () => Promise.resolve(adminUser) as any
    );

    const requestBody = {
      title: "新问卷",
      description: "新描述",
      year: "2024-2025",
      semester: 1,
      week: 1,
      questions: [
        {
          description: "新问题",
          config: { type: QuestionType.INPUT, required: true }
        }
      ]
    };

    const ctx = testing.createMockContext({
      path: "/",
      method: "POST",
      headers: [["content-type", "application/json"], ["authorization", `Bearer ${authToken}`]],
      body: ReadableStream.from([new TextEncoder().encode(JSON.stringify(requestBody))]),
    });

    const middleware = surveyRouter.routes();
    const next = testing.createMockNext();
    await middleware(ctx, next);

    assertEquals(ctx.response.status, 201);
    const body = ctx.response.body as any;
    assertEquals(body.title, "新问卷");
    assertEquals(body.questions.length, 1);
  });

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

  await t.step("DELETE /:id - 应该成功删除问卷", async () => {
    const passwordHash = await hashPassword("admin123");
    const adminUser = {
      id: 1,
      name: "ADMIN",
      id_number: "ADMIN",
      role: UserRole.ADMIN,
      password: passwordHash
    };
    const authToken = await generateToken(adminUser.id, adminUser.role);

    using deleteStub = stub(
      prisma.survey,
      "delete",
      () => Promise.resolve({ 
        id: 1, 
        title: "已删除", 
        description: null, 
        year: "2024", 
        semester: 1, 
        week: 1, 
        created_at: new Date() 
      }) as any
    );

    using findUniqueStub = stub(
      prisma.user,
      "findUnique",
      () => Promise.resolve(adminUser) as any
    );

    const ctx = testing.createMockContext({
      path: "/1",
      method: "DELETE",
      params: { id: "1" },
      headers: [["authorization", `Bearer ${authToken}`]]
    });

    const middleware = surveyRouter.routes();
    const next = testing.createMockNext();
    await middleware(ctx, next);

    assertEquals(ctx.response.status, 200);
    const body = ctx.response.body as any;
    assertEquals(body.success, true);
  });

  await t.step("GET /:id/results - 应该返回问卷结果", async () => {
    const passwordHash = await hashPassword("admin123");
    const adminUser = {
      id: 1,
      name: "ADMIN",
      id_number: "ADMIN",
      role: UserRole.ADMIN,
      password: passwordHash
    };
    const authToken = await generateToken(adminUser.id, adminUser.role);

    const mockSurvey = {
      id: 1,
      title: "测试问卷",
      description: "测试",
      year: "2024",
      semester: 1,
      week: 1,
      created_at: new Date(),
      questions: []
    };

    const mockSubmissions = [
      {
        id: 1,
        survey_id: 1,
        user_id: 1,
        created_at: new Date(),
        user: { id: 1, name: "测试用户", id_number: "001", role: 1 },
        answers: []
      }
    ];

    using findUniqueStub = stub(
      prisma.survey,
      "findUnique",
      () => Promise.resolve(mockSurvey) as any
    );

    using findManyStub = stub(
      prisma.submission,
      "findMany",
      () => Promise.resolve(mockSubmissions) as any
    );

    using countStub = stub(
      prisma.submission,
      "count",
      () => Promise.resolve(1) as any
    );

    using findUniqueUserStub = stub(
      prisma.user,
      "findUnique",
      () => Promise.resolve(adminUser) as any
    );

    const ctx = testing.createMockContext({
      path: "/1/results?page=1&limit=20",
      method: "GET",
      params: { id: "1" },
      headers: [["authorization", `Bearer ${authToken}`]]
    });

    const middleware = surveyRouter.routes();
    const next = testing.createMockNext();
    await middleware(ctx, next);

    assertEquals(ctx.response.status, 200);
    const body = ctx.response.body as any;
    assertEquals(body.survey.id, 1);
    assertEquals(body.submissions.length, 1);
  });

  await t.step("GET /:id/insights/:questionId - 应该返回统计洞察", async () => {
    const passwordHash = await hashPassword("admin123");
    const adminUser = {
      id: 1,
      name: "ADMIN",
      id_number: "ADMIN",
      role: UserRole.ADMIN,
      password: passwordHash
    };
    const authToken = await generateToken(adminUser.id, adminUser.role);

    const mockQuestion = {
      id: 1,
      survey_id: 1,
      description: "测试问题",
      config: { type: QuestionType.STAR, maxStars: 5, required: true }
    };

    const mockAnswers = [
      { value: "5" },
      { value: "4" },
      { value: "5" }
    ];

    using findUniqueQuestionStub = stub(
      prisma.question,
      "findUnique",
      () => Promise.resolve(mockQuestion) as any
    );

    using findManyAnswersStub = stub(
      prisma.answer,
      "findMany",
      () => Promise.resolve(mockAnswers) as any
    );

    using findUniqueUserStub = stub(
      prisma.user,
      "findUnique",
      () => Promise.resolve(adminUser) as any
    );

    const ctx = testing.createMockContext({
      path: "/1/insights/1",
      method: "GET",
      params: { id: "1", questionId: "1" },
      headers: [["authorization", `Bearer ${authToken}`]]
    });

    const middleware = surveyRouter.routes();
    const next = testing.createMockNext();
    await middleware(ctx, next);

    assertEquals(ctx.response.status, 200);
    const body = ctx.response.body as any;
    assertEquals(body.type, "star");
    assertExists(body.distribution);
  });
});
