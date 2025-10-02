// 提交答案路由单元测试
import { assertEquals, assertExists } from "@std/assert";
import { stub } from "@std/testing/mock";
import { prisma } from "../db_mock.ts";
import { QuestionType, UserRole } from "../types.ts";

// 测试提交答案 - 正常流程
Deno.test("submitAnswers - 应该成功创建提交记录", async () => {
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

  const findUniqueSurveyStub = stub(
    prisma.survey,
    "findUnique",
    () => Promise.resolve(mockSurvey)
  );

  const findFirstUserStub = stub(
    prisma.user,
    "findFirst",
    () => Promise.resolve(mockUser)
  );

  const findUniqueSubmissionStub = stub(
    prisma.submission,
    "findUnique",
    () => Promise.resolve(null) // 用户尚未提交
  );

  const createSubmissionStub = stub(
    prisma.submission,
    "create",
    () => Promise.resolve(mockSubmission)
  );

  try {
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

    // 检查问卷是否存在
    const survey = await prisma.survey.findUnique({
      where: { id: requestBody.survey_id },
      include: { questions: true },
    });

    assertExists(survey);
    assertEquals(survey.questions.length, 2);

    // 查找用户
    const user = await prisma.user.findFirst({
      where: {
        name: requestBody.user.name,
        id_number: requestBody.user.id_number,
      },
    });

    assertExists(user);

    // 检查是否已提交
    const existingSubmission = await prisma.submission.findUnique({
      where: {
        survey_id_user_id: {
          survey_id: requestBody.survey_id,
          user_id: user.id,
        },
      },
    });

    assertEquals(existingSubmission, null);

    // 验证答案对应问题
    const questionIds = survey.questions.map((q: any) => q.id);
    const answerQuestionIds = requestBody.answers.map(a => a.question_id);
    const invalidQuestionIds = answerQuestionIds.filter(id => !questionIds.includes(id));
    
    assertEquals(invalidQuestionIds.length, 0);

    // 创建提交
    const submission = await prisma.submission.create({
      data: {
        survey_id: requestBody.survey_id,
        user_id: user.id,
        answers: {
          create: requestBody.answers.map(answer => ({
            question_id: answer.question_id,
            value: answer.value,
          }))
        }
      },
      include: {
        answers: true,
        user: true,
      },
    });

    assertExists(submission);
    assertEquals(submission.answers.length, 2);
    assertEquals(submission.user.name, "张三");
  } finally {
    findUniqueSurveyStub.restore();
    findFirstUserStub.restore();
    findUniqueSubmissionStub.restore();
    createSubmissionStub.restore();
  }
});

// 测试提交答案 - 创建新用户
Deno.test("submitAnswers - 应该为新用户创建账户", async () => {
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

  const findUniqueSurveyStub = stub(
    prisma.survey,
    "findUnique",
    () => Promise.resolve(mockSurvey)
  );

  const findFirstUserStub = stub(
    prisma.user,
    "findFirst",
    () => Promise.resolve(null) // 用户不存在
  );

  const createUserStub = stub(
    prisma.user,
    "create",
    () => Promise.resolve(newUser)
  );

  const findUniqueSubmissionStub = stub(
    prisma.submission,
    "findUnique",
    () => Promise.resolve(null)
  );

  try {
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

    // 检查问卷
    const survey = await prisma.survey.findUnique({
      where: { id: requestBody.survey_id },
      include: { questions: true },
    });

    assertExists(survey);

    // 查找用户
    let user = await prisma.user.findFirst({
      where: {
        name: requestBody.user.name,
        id_number: requestBody.user.id_number,
      },
    });

    // 用户不存在，创建新用户
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: requestBody.user.name,
          id_number: requestBody.user.id_number,
          role: UserRole.STUDENT,
        },
      });
    }

    assertExists(user);
    assertEquals(user.name, "李四");
    assertEquals(user.role, UserRole.STUDENT);
  } finally {
    findUniqueSurveyStub.restore();
    findFirstUserStub.restore();
    createUserStub.restore();
    findUniqueSubmissionStub.restore();
  }
});

// 测试提交答案 - 验证重复提交
Deno.test("submitAnswers - 应该检测到重复提交", async () => {
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

  const findUniqueSurveyStub = stub(
    prisma.survey,
    "findUnique",
    () => Promise.resolve(mockSurvey)
  );

  const findFirstUserStub = stub(
    prisma.user,
    "findFirst",
    () => Promise.resolve(mockUser)
  );

  const findUniqueSubmissionStub = stub(
    prisma.submission,
    "findUnique",
    () => Promise.resolve(existingSubmission) // 已经存在提交
  );

  try {
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

    // 检查问卷
    const survey = await prisma.survey.findUnique({
      where: { id: requestBody.survey_id },
      include: { questions: true },
    });

    assertExists(survey);

    // 查找用户
    const user = await prisma.user.findFirst({
      where: {
        name: requestBody.user.name,
        id_number: requestBody.user.id_number,
      },
    });

    assertExists(user);

    // 检查是否已提交
    const existing = await prisma.submission.findUnique({
      where: {
        survey_id_user_id: {
          survey_id: requestBody.survey_id,
          user_id: user.id,
        },
      },
    });

    // 应该检测到已有提交
    assertExists(existing);
    assertEquals(existing.survey_id, 1);
    assertEquals(existing.user_id, 1);
  } finally {
    findUniqueSurveyStub.restore();
    findFirstUserStub.restore();
    findUniqueSubmissionStub.restore();
  }
});

// 测试提交答案 - 验证无效问题ID
Deno.test("submitAnswers - 应该检测无效的问题ID", async () => {
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

  const findUniqueSurveyStub = stub(
    prisma.survey,
    "findUnique",
    () => Promise.resolve(mockSurvey)
  );

  try {
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

    // 检查问卷
    const survey = await prisma.survey.findUnique({
      where: { id: requestBody.survey_id },
      include: { questions: true },
    });

    assertExists(survey);

    // 验证答案对应问题
    const questionIds = survey.questions.map((q: any) => q.id);
    const answerQuestionIds = requestBody.answers.map(a => a.question_id);
    const invalidQuestionIds = answerQuestionIds.filter(id => !questionIds.includes(id));
    
    // 应该检测到无效的问题ID
    assertEquals(invalidQuestionIds.length, 1);
    assertEquals(invalidQuestionIds[0], 99);
  } finally {
    findUniqueSurveyStub.restore();
  }
});
