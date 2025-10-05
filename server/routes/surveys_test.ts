// 问卷路由单元测试 - 使用 Oak testing utilities
import { assertEquals, assertExists } from "@std/assert";
import { stub } from "@std/testing/mock";
import { testing } from "@oak/oak";
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
  assertEquals(body.id, 1);
  assertEquals(body.title, "测试问卷");
  assertEquals(body.questions.length, 1);
});

// 测试获取不存在的问卷
Deno.test("GET /:id - 问卷不存在时应该返回404", async () => {
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
    () => Promise.resolve(mockCreatedSurvey) as any
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
    headers: [["content-type", "application/json"]],
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

// 测试创建问卷时缺少必要字段
Deno.test("POST / - 缺少必要字段时应该返回400", async () => {
  const requestBody = {
    title: "新问卷",
    // 缺少 year, semester, week
  };

  const ctx = testing.createMockContext({
    path: "/",
    method: "POST",
    headers: [["content-type", "application/json"]],
    body: ReadableStream.from([new TextEncoder().encode(JSON.stringify(requestBody))]),
  });

  const middleware = surveyRouter.routes();
  const next = testing.createMockNext();
  await middleware(ctx, next);

  assertEquals(ctx.response.status, 400);
  const body = ctx.response.body as any;
  assertEquals(body.error, "缺少必要字段");
});

// 测试更新问卷 - 已有提交记录时不允许更新
Deno.test("PUT /:id - 已有提交记录时应该返回400", async () => {
  using countStub = stub(
    prisma.submission,
    "count",
    () => Promise.resolve(5) as any // 5个提交记录
  );

  const requestBody = {
    title: "更新的问卷",
    description: "更新的描述",
    year: "2024",
    semester: 1,
    week: 10,
    questions: [
      {
        description: "新问题",
        config: { type: QuestionType.STAR, maxStars: 5, required: true }
      }
    ]
  };

  const ctx = testing.createMockContext({
    path: "/1",
    method: "PUT",
    params: { id: "1" },
    headers: [["content-type", "application/json"]],
    body: ReadableStream.from([new TextEncoder().encode(JSON.stringify(requestBody))]),
  });

  const middleware = surveyRouter.routes();
  const next = testing.createMockNext();
  await middleware(ctx, next);

  assertEquals(ctx.response.status, 400);
  const body = ctx.response.body as any;
  assertEquals(body.error, "该问卷已有提交记录，不能修改问题。建议创建新问卷。");
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
    }) as any
  );

  const ctx = testing.createMockContext({
    path: "/1",
    method: "DELETE",
    params: { id: "1" }
  });

  const middleware = surveyRouter.routes();
  const next = testing.createMockNext();
  await middleware(ctx, next);

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

  const ctx = testing.createMockContext({
    path: "/1/results?page=1&limit=20",
    method: "GET",
    params: { id: "1" }
  });

  const middleware = surveyRouter.routes();
  const next = testing.createMockNext();
  await middleware(ctx, next);

  assertEquals(ctx.response.status, 200);
  const body = ctx.response.body as any;
  assertExists(body.survey);
  assertEquals(body.submissions.length, 1);
  assertEquals(body.total, 1);
  assertEquals(body.submissions[0].user.name, "张三");
});

// 测试获取问题统计 - 星级类型
Deno.test("GET /:id/insights/:questionId - 应该返回星级问题的统计", async () => {
  const mockQuestion = {
    id: 1,
    survey_id: 1,
    description: "满意度评分",
    config: { type: QuestionType.STAR, maxStars: 5 }
  };

  const mockAnswers = [
    { value: "5" },
    { value: "4" },
    { value: "5" },
    { value: "3" },
    { value: "5" }
  ];

  using findUniqueStub = stub(
    prisma.question,
    "findUnique",
    () => Promise.resolve(mockQuestion) as any
  );

  using findManyStub = stub(
    prisma.answer,
    "findMany",
    () => Promise.resolve(mockAnswers) as any
  );

  const ctx = testing.createMockContext({
    path: "/1/insights/1",
    method: "GET",
  });
  ctx.params = { id: "1", questionId: "1" };

  const middleware = surveyRouter.routes();
  const next = testing.createMockNext();
  await middleware(ctx, next);

  assertEquals(ctx.response.status, 200);
  const body = ctx.response.body as any;
  assertEquals(body.type, "star");
  assertExists(body.distribution);
  assertEquals(body.total, 5);
  assertEquals(body.distribution[5], 3);
  assertEquals(body.distribution[4], 1);
  assertEquals(body.distribution[3], 1);
});

// 测试获取问题统计 - 文本类型（词云）
Deno.test("GET /:id/insights/:questionId - 应该返回文本问题的词云", async () => {
  const mockQuestion = {
    id: 2,
    survey_id: 1,
    description: "意见建议",
    config: { type: QuestionType.INPUT }
  };

  const mockAnswers = [
    { value: "老师很好，课程内容丰富" },
    { value: "课程内容很有趣" },
    { value: "希望增加实践课程" }
  ];

  using findUniqueStub = stub(
    prisma.question,
    "findUnique",
    () => Promise.resolve(mockQuestion) as any
  );

  using findManyStub = stub(
    prisma.answer,
    "findMany",
    () => Promise.resolve(mockAnswers) as any
  );

  const ctx = testing.createMockContext({
    path: "/1/insights/2",
    method: "GET",
  });
  ctx.params = { id: "1", questionId: "2" };

  const middleware = surveyRouter.routes();
  const next = testing.createMockNext();
  await middleware(ctx, next);

  assertEquals(ctx.response.status, 200);
  const body = ctx.response.body as any;
  assertEquals(body.type, "wordcloud");
  assertExists(body.words);
  assertEquals(Array.isArray(body.words), true);
});
