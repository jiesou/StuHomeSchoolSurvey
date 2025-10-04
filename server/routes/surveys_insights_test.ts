// 问卷 insights 端点集成测试
import { assertEquals, assertExists } from "@std/assert";
import { stub } from "@std/testing/mock";
import { testing } from "@oak/oak";
import { surveyRouter } from "./surveys.ts";
import { prisma } from "../db.ts";
import { QuestionType } from "../types.ts";

// 测试获取INPUT类型问题的词云数据
Deno.test("GET /:id/insights/:questionId - INPUT类型应返回词云数据", async () => {
  const mockQuestion = {
    id: 1,
    survey_id: 1,
    description: "您对老师的评价",
    config: {
      type: QuestionType.INPUT,
      placeholder: "请输入",
    },
  };

  const mockAnswers = [
    { id: 1, question_id: 1, submission_id: 1, value: "老师讲课很好" },
    { id: 2, question_id: 1, submission_id: 2, value: "教学质量不错" },
    { id: 3, question_id: 1, submission_id: 3, value: "老师认真负责" },
  ];

  using questionStub = stub(
    prisma.question,
    "findFirst",
    () => Promise.resolve(mockQuestion) as any
  );

  using answersStub = stub(
    prisma.answer,
    "findMany",
    () => Promise.resolve(mockAnswers) as any
  );

  const ctx = testing.createMockContext({
    path: "/1/insights/1",
    method: "GET",
    params: { id: "1", questionId: "1" },
  });

  await surveyRouter.routes()(ctx, async () => {});

  assertEquals(ctx.response.status, 200);
  assertExists(ctx.response.body);
  
  const body = ctx.response.body as any;
  assertEquals(body.type, "wordcloud");
  assertEquals(body.questionId, 1);
  assertEquals(body.questionType, QuestionType.INPUT);
  assertEquals(Array.isArray(body.words), true);
  assertEquals(body.totalResponses, 3);
});

// 测试获取STAR类型问题的星级分布数据
Deno.test("GET /:id/insights/:questionId - STAR类型应返回星级分布数据", async () => {
  const mockQuestion = {
    id: 2,
    survey_id: 1,
    description: "您对课程的评分",
    config: {
      type: QuestionType.STAR,
      maxStars: 5,
    },
  };

  const mockAnswers = [
    { id: 1, question_id: 2, submission_id: 1, value: "5" },
    { id: 2, question_id: 2, submission_id: 2, value: "4" },
    { id: 3, question_id: 2, submission_id: 3, value: "5" },
    { id: 4, question_id: 2, submission_id: 4, value: "3" },
  ];

  using questionStub = stub(
    prisma.question,
    "findFirst",
    () => Promise.resolve(mockQuestion) as any
  );

  using answersStub = stub(
    prisma.answer,
    "findMany",
    () => Promise.resolve(mockAnswers) as any
  );

  const ctx = testing.createMockContext({
    path: "/1/insights/2",
    method: "GET",
    params: { id: "1", questionId: "2" },
  });

  await surveyRouter.routes()(ctx, async () => {});

  assertEquals(ctx.response.status, 200);
  assertExists(ctx.response.body);
  
  const body = ctx.response.body as any;
  assertEquals(body.type, "star_distribution");
  assertEquals(body.questionId, 2);
  assertEquals(body.questionType, QuestionType.STAR);
  assertEquals(typeof body.distribution, "object");
  assertEquals(typeof body.average, "number");
  assertEquals(body.totalResponses, 4);
  assertEquals(body.average, 4.25); // (5+4+5+3)/4 = 4.25
});

// 测试问题不存在的情况
Deno.test("GET /:id/insights/:questionId - 问题不存在应返回404", async () => {
  using questionStub = stub(
    prisma.question,
    "findFirst",
    () => Promise.resolve(null) as any
  );

  const ctx = testing.createMockContext({
    path: "/1/insights/999",
    method: "GET",
    params: { id: "1", questionId: "999" },
  });

  await surveyRouter.routes()(ctx, async () => {});

  assertEquals(ctx.response.status, 404);
  assertEquals((ctx.response.body as any).error, "问题不存在");
});
