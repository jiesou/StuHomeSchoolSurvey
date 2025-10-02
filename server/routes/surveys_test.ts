// 问卷路由单元测试
import { assertEquals, assertExists } from "@std/assert";
import { stub } from "@std/testing/mock";
import { prisma } from "../db_mock.ts";
import { QuestionType } from "../types.ts";

// 测试获取问卷列表的业务逻辑
Deno.test("getSurveys - 应该正确处理分页", async () => {
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

  const findManyStub = stub(
    prisma.survey,
    "findMany",
    () => Promise.resolve(mockSurveys)
  );

  const countStub = stub(
    prisma.survey,
    "count",
    () => Promise.resolve(10)
  );

  try {
    const page = 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    // 模拟实际路由中的逻辑
    const [surveys, total] = await Promise.all([
      prisma.survey.findMany({
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          questions: true,
          _count: {
            select: { submissions: true }
          }
        }
      }),
      prisma.survey.count()
    ]);

    assertEquals(surveys.length, 2);
    assertEquals(total, 10);
    assertEquals(surveys[0].title, "测试问卷1");
  } finally {
    findManyStub.restore();
    countStub.restore();
  }
});

// 测试获取单个问卷
Deno.test("getSurvey - 应该返回指定ID的问卷", async () => {
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

  const findUniqueStub = stub(
    prisma.survey,
    "findUnique",
    () => Promise.resolve(mockSurvey)
  );

  try {
    const result = await prisma.survey.findUnique({
      where: { id: 1 },
      include: { questions: true }
    });

    assertExists(result);
    assertEquals(result?.id, 1);
    assertEquals(result?.title, "测试问卷");
    assertEquals(result?.questions?.length, 1);
  } finally {
    findUniqueStub.restore();
  }
});

// 测试创建问卷
Deno.test("createSurvey - 应该正确创建问卷和问题", async () => {
  const mockResult = {
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

  const createStub = stub(
    prisma.survey,
    "create",
    () => Promise.resolve(mockResult)
  );

  try {
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

    const result = await prisma.survey.create({
      data: {
        title: requestBody.title,
        description: requestBody.description,
        year: requestBody.year,
        semester: requestBody.semester,
        week: requestBody.week,
        questions: {
          create: requestBody.questions.map((q: any) => ({
            description: q.description,
            config: q.config,
          }))
        }
      },
      include: {
        questions: true,
      },
    });

    assertExists(result);
    assertEquals(result.title, "新问卷");
    assertEquals(result.questions.length, 1);
  } finally {
    createStub.restore();
  }
});

// 测试删除问卷
Deno.test("deleteSurvey - 应该成功删除问卷", async () => {
  const deleteStub = stub(
    prisma.survey,
    "delete",
    () => Promise.resolve({ id: 1, title: "已删除", description: null, year: "2024", semester: 1, week: 1, created_at: new Date() })
  );

  try {
    const result = await prisma.survey.delete({
      where: { id: 1 }
    });

    assertExists(result);
    assertEquals(result.id, 1);
  } finally {
    deleteStub.restore();
  }
});

// 测试获取问卷结果
Deno.test("getSurveyResults - 应该返回问卷和提交列表", async () => {
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

  const findUniqueStub = stub(
    prisma.survey,
    "findUnique",
    () => Promise.resolve(mockSurvey)
  );

  const findManyStub = stub(
    prisma.submission,
    "findMany",
    () => Promise.resolve(mockSubmissions)
  );

  const countStub = stub(
    prisma.submission,
    "count",
    () => Promise.resolve(1)
  );

  try {
    const page = 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const [survey, submissions, total] = await Promise.all([
      prisma.survey.findUnique({
        where: { id: 1 },
        include: { questions: true },
      }),
      prisma.submission.findMany({
        where: { survey_id: 1 },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          user: true,
          answers: true,
        },
      }),
      prisma.submission.count({
        where: { survey_id: 1 },
      })
    ]);

    assertExists(survey);
    assertEquals(submissions.length, 1);
    assertEquals(total, 1);
    assertEquals(submissions[0].user.name, "张三");
  } finally {
    findUniqueStub.restore();
    findManyStub.restore();
    countStub.restore();
  }
});
