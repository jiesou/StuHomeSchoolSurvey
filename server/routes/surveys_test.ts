// 问卷路由单元测试 - 使用 Oak testing utilities
import { assertEquals, assertExists } from "@std/assert";
import { stub, returnsNext } from "@std/testing/mock";
import { testing, Application } from "@oak/oak";
import { surveyRouter } from "./surveys.ts";
import { prisma } from "../db.ts";
import { QuestionType } from "../types.ts";

// 测试获取问卷列表
Deno.test("GET / - 应该返回分页的问卷列表", async () => {
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
    () => Promise.resolve(mockSurveys as any)
  );

  using countStub = stub(
    prisma.survey,
    "count",
    () => Promise.resolve(10 as any)
  );

  const ctx = testing.createMockContext({
    path: "/?page=1&limit=10",
    method: "GET",
  });
  
  const app = new Application();
  app.use(surveyRouter.routes());
  
  // 手动调用路由中间件
  const middleware = surveyRouter.routes();
  await middleware(ctx, async () => {});

  assertEquals(ctx.response.status, 200);
  const body = ctx.response.body as any;
  assertEquals(body.surveys.length, 2);
  assertEquals(body.total, 10);
  assertEquals(body.page, 1);
  assertEquals(body.limit, 10);
  assertEquals(body.surveys[0].title, "测试问卷1");
});

// 测试获取单个问卷
Deno.test("GET /:id - 应该返回指定ID的问卷", async () => {
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
    () => Promise.resolve(mockSurvey as any)
  );

  const ctx = testing.createMockContext({
    path: "/1",
    method: "GET",
    params: { id: "1" }
  });

  const middleware = surveyRouter.routes();
  await middleware(ctx, async () => {});

  assertEquals(ctx.response.status, 200);
  const body = ctx.response.body as any;
  assertEquals(body.id, 1);
  assertEquals(body.title, "测试问卷");
  assertEquals(body.questions.length, 1);
});

// 测试获取不存在的问卷
Deno.test("GET /:id - 问卷不存在时应该返回404", async () => {
  using findUniqueStub = stub(
    prisma.survey,
    "findUnique",
    () => Promise.resolve(null as any)
  );

  const ctx = testing.createMockContext({
    path: "/999",
    method: "GET",
    params: { id: "999" }
  });

  const middleware = surveyRouter.routes();
  await middleware(ctx, async () => {});

  assertEquals(ctx.response.status, 404);
  const body = ctx.response.body as any;
  assertEquals(body.error, "问卷不存在");
});

// 测试创建问卷
Deno.test("POST / - 应该成功创建问卷", async () => {
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
    () => Promise.resolve(mockCreatedSurvey as any)
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

  const bodyStream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(JSON.stringify(requestBody)));
      controller.close();
    },
  });

  const ctx = testing.createMockContext({
    path: "/",
    method: "POST",
    headers: [["content-type", "application/json"]],
    body: bodyStream,
  });

  const middleware = surveyRouter.routes();
  await middleware(ctx, async () => {});

  assertEquals(ctx.response.status, 201);
  const body = ctx.response.body as any;
  assertEquals(body.title, "新问卷");
  assertEquals(body.questions.length, 1);
});

// 测试创建问卷时缺少必要字段
Deno.test("POST / - 缺少必要字段时应该返回400", async () => {
  const requestBody = {
    title: "新问卷",
    // 缺少 year, semester, week
  };

  const bodyStream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(JSON.stringify(requestBody)));
      controller.close();
    },
  });

  const ctx = testing.createMockContext({
    path: "/",
    method: "POST",
    headers: [["content-type", "application/json"]],
    body: bodyStream,
  });

  const middleware = surveyRouter.routes();
  await middleware(ctx, async () => {});

  assertEquals(ctx.response.status, 400);
  const body = ctx.response.body as any;
  assertEquals(body.error, "缺少必要字段");
});

// 测试删除问卷
Deno.test("DELETE /:id - 应该成功删除问卷", async () => {
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
    } as any)
  );

  const ctx = testing.createMockContext({
    path: "/1",
    method: "DELETE",
    params: { id: "1" }
  });

  const middleware = surveyRouter.routes();
  await middleware(ctx, async () => {});

  assertEquals(ctx.response.status, 200);
  const body = ctx.response.body as any;
  assertEquals(body.success, true);
  assertEquals(body.message, "问卷删除成功");
});

// 测试获取问卷结果
Deno.test("GET /:id/results - 应该返回问卷和提交列表", async () => {
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
      user: {
        id: 1,
        name: "张三",
        id_number: "2023001",
        role: 1
      },
      answers: []
    }
  ];

  using findUniqueStub = stub(
    prisma.survey,
    "findUnique",
    () => Promise.resolve(mockSurvey as any)
  );

  using findManyStub = stub(
    prisma.submission,
    "findMany",
    () => Promise.resolve(mockSubmissions as any)
  );

  using countStub = stub(
    prisma.submission,
    "count",
    () => Promise.resolve(1 as any)
  );

  const ctx = testing.createMockContext({
    path: "/1/results?page=1&limit=20",
    method: "GET",
    params: { id: "1" }
  });

  const middleware = surveyRouter.routes();
  await middleware(ctx, async () => {});

  assertEquals(ctx.response.status, 200);
  const body = ctx.response.body as any;
  assertExists(body.survey);
  assertEquals(body.submissions.length, 1);
  assertEquals(body.total, 1);
  assertEquals(body.submissions[0].user.name, "张三");
});
