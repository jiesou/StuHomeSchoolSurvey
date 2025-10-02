// 提交答案路由单元测试 - 使用 Oak testing utilities
import { assertEquals, assertExists } from "@std/assert";
import { stub } from "@std/testing/mock";
import { testing } from "@oak/oak";
import { submissionRouter } from "./submissions.ts";
import { prisma } from "../db.ts";
import { QuestionType, UserRole } from "../types.ts";

// 测试提交答案 - 正常流程
Deno.test("POST / - 应该成功创建提交记录", async () => {
  const mockSurvey = {
    id: 1,
    title: "测试问卷",
    description: "测试",
    year: "2024",
    semester: 1,
    week: 1,
    created_at: new Date(),
    questions: [
      {
        id: 1,
        survey_id: 1,
        description: "问题1",
        config: { type: QuestionType.STAR, maxStars: 5, required: true }
      },
      {
        id: 2,
        survey_id: 1,
        description: "问题2",
        config: { type: QuestionType.INPUT, required: false }
      }
    ]
  };

  const mockUser = {
    id: 1,
    name: "张三",
    id_number: "2023001",
    role: UserRole.STUDENT
  };

  const mockSubmission = {
    id: 1,
    survey_id: 1,
    user_id: 1,
    created_at: new Date(),
    user: mockUser,
    answers: [
      {
        id: 1,
        question_id: 1,
        submission_id: 1,
        value: "5"
      },
      {
        id: 2,
        question_id: 2,
        submission_id: 1,
        value: "很好"
      }
    ]
  };

  using findUniqueSurveyStub = stub(
    prisma.survey,
    "findUnique",
    () => Promise.resolve(mockSurvey as any)
  );

  using findFirstUserStub = stub(
    prisma.user,
    "findFirst",
    () => Promise.resolve(mockUser as any)
  );

  using findUniqueSubmissionStub = stub(
    prisma.submission,
    "findUnique",
    () => Promise.resolve(null as any)
  );

  using createSubmissionStub = stub(
    prisma.submission,
    "create",
    () => Promise.resolve(mockSubmission as any)
  );

  const requestBody = {
    survey_id: 1,
    user: {
      name: "张三",
      id_number: "2023001"
    },
    answers: [
      { question_id: 1, value: "5" },
      { question_id: 2, value: "很好" }
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

  const middleware = submissionRouter.routes();
  await middleware(ctx, async () => {});

  assertEquals(ctx.response.status, 201);
  const body = ctx.response.body as any;
  assertExists(body);
  assertEquals(body.answers.length, 2);
  assertEquals(body.user.name, "张三");
});

// 测试提交答案 - 创建新用户
Deno.test("POST / - 应该为新用户创建账户", async () => {
  const mockSurvey = {
    id: 1,
    title: "测试问卷",
    description: "测试",
    year: "2024",
    semester: 1,
    week: 1,
    created_at: new Date(),
    questions: [
      {
        id: 1,
        survey_id: 1,
        description: "问题1",
        config: { type: QuestionType.STAR, maxStars: 5, required: true }
      }
    ]
  };

  const newUser = {
    id: 2,
    name: "李四",
    id_number: "2023002",
    role: UserRole.STUDENT
  };

  const mockSubmission = {
    id: 2,
    survey_id: 1,
    user_id: 2,
    created_at: new Date(),
    user: newUser,
    answers: [
      {
        id: 3,
        question_id: 1,
        submission_id: 2,
        value: "4"
      }
    ]
  };

  using findUniqueSurveyStub = stub(
    prisma.survey,
    "findUnique",
    () => Promise.resolve(mockSurvey as any)
  );

  using findFirstUserStub = stub(
    prisma.user,
    "findFirst",
    () => Promise.resolve(null as any)
  );

  using createUserStub = stub(
    prisma.user,
    "create",
    () => Promise.resolve(newUser as any)
  );

  using findUniqueSubmissionStub = stub(
    prisma.submission,
    "findUnique",
    () => Promise.resolve(null as any)
  );

  using createSubmissionStub = stub(
    prisma.submission,
    "create",
    () => Promise.resolve(mockSubmission as any)
  );

  const requestBody = {
    survey_id: 1,
    user: {
      name: "李四",
      id_number: "2023002"
    },
    answers: [
      { question_id: 1, value: "4" }
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

  const middleware = submissionRouter.routes();
  await middleware(ctx, async () => {});

  assertEquals(ctx.response.status, 201);
  const body = ctx.response.body as any;
  assertExists(body);
  assertEquals(body.user.name, "李四");
  assertEquals(body.user.role, UserRole.STUDENT);
});

// 测试提交答案 - 检测重复提交
Deno.test("POST / - 应该检测到重复提交", async () => {
  const mockSurvey = {
    id: 1,
    title: "测试问卷",
    description: "测试",
    year: "2024",
    semester: 1,
    week: 1,
    created_at: new Date(),
    questions: [
      {
        id: 1,
        survey_id: 1,
        description: "问题1",
        config: { type: QuestionType.STAR, maxStars: 5, required: true }
      }
    ]
  };

  const mockUser = {
    id: 1,
    name: "张三",
    id_number: "2023001",
    role: UserRole.STUDENT
  };

  const existingSubmission = {
    id: 1,
    survey_id: 1,
    user_id: 1,
    created_at: new Date()
  };

  using findUniqueSurveyStub = stub(
    prisma.survey,
    "findUnique",
    () => Promise.resolve(mockSurvey as any)
  );

  using findFirstUserStub = stub(
    prisma.user,
    "findFirst",
    () => Promise.resolve(mockUser as any)
  );

  using findUniqueSubmissionStub = stub(
    prisma.submission,
    "findUnique",
    () => Promise.resolve(existingSubmission as any)
  );

  const requestBody = {
    survey_id: 1,
    user: {
      name: "张三",
      id_number: "2023001"
    },
    answers: [
      { question_id: 1, value: "5" }
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

  const middleware = submissionRouter.routes();
  await middleware(ctx, async () => {});

  assertEquals(ctx.response.status, 409);
  const body = ctx.response.body as any;
  assertEquals(body.error, "您已经提交过这份问卷");
});

// 测试提交答案 - 问卷不存在
Deno.test("POST / - 问卷不存在时应该返回404", async () => {
  using findUniqueSurveyStub = stub(
    prisma.survey,
    "findUnique",
    () => Promise.resolve(null as any)
  );

  const requestBody = {
    survey_id: 999,
    user: {
      name: "张三",
      id_number: "2023001"
    },
    answers: [
      { question_id: 1, value: "5" }
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

  const middleware = submissionRouter.routes();
  await middleware(ctx, async () => {});

  assertEquals(ctx.response.status, 404);
  const body = ctx.response.body as any;
  assertEquals(body.error, "问卷不存在");
});

// 测试提交答案 - 缺少必要字段
Deno.test("POST / - 缺少必要字段时应该返回400", async () => {
  const requestBody = {
    survey_id: 1,
    // 缺少 user 和 answers
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

  const middleware = submissionRouter.routes();
  await middleware(ctx, async () => {});

  assertEquals(ctx.response.status, 400);
  const body = ctx.response.body as any;
  assertEquals(body.error, "缺少必要字段");
});

// 测试提交答案 - 无效的问题ID
Deno.test("POST / - 应该检测无效的问题ID", async () => {
  const mockSurvey = {
    id: 1,
    title: "测试问卷",
    description: "测试",
    year: "2024",
    semester: 1,
    week: 1,
    created_at: new Date(),
    questions: [
      {
        id: 1,
        survey_id: 1,
        description: "问题1",
        config: { type: QuestionType.STAR, maxStars: 5, required: true }
      },
      {
        id: 2,
        survey_id: 1,
        description: "问题2",
        config: { type: QuestionType.INPUT, required: false }
      }
    ]
  };

  const mockUser = {
    id: 1,
    name: "张三",
    id_number: "2023001",
    role: UserRole.STUDENT
  };

  using findUniqueSurveyStub = stub(
    prisma.survey,
    "findUnique",
    () => Promise.resolve(mockSurvey as any)
  );

  using findFirstUserStub = stub(
    prisma.user,
    "findFirst",
    () => Promise.resolve(mockUser as any)
  );

  using findUniqueSubmissionStub = stub(
    prisma.submission,
    "findUnique",
    () => Promise.resolve(null as any)
  );

  const requestBody = {
    survey_id: 1,
    user: {
      name: "张三",
      id_number: "2023001"
    },
    answers: [
      { question_id: 1, value: "5" },
      { question_id: 99, value: "错误" } // 无效的问题ID
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

  const middleware = submissionRouter.routes();
  await middleware(ctx, async () => {});

  assertEquals(ctx.response.status, 400);
  const body = ctx.response.body as any;
  assertEquals(body.error, "无效的问题ID: 99");
});
