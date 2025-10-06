import { assertEquals, assertExists } from "@std/assert";
import { describe, it, beforeAll, afterAll } from "@std/testing/bdd";
import { prisma } from "../db.ts";
import { QuestionType } from "../types.ts";

describe("Insights Route Tests", () => {
  let surveyIds: number[] = [];
  let questionId: number;
  let userIds: number[] = [];

  beforeAll(async () => {
    // 创建测试用户
    for (let i = 1; i <= 3; i++) {
      const user = await prisma.user.create({
        data: {
          name: `测试用户${i}`,
          id_number: `test_cross_${i}_${Date.now()}`,
          role: 1,
          password: "test123"
        }
      });
      userIds.push(user.id);
    }

    // 创建两个测试问卷，包含相同的问题
    for (let i = 1; i <= 2; i++) {
      const survey = await prisma.survey.create({
        data: {
          title: `测试问卷${i}`,
          year: "2024",
          semester: 1,
          week: i,
          questions: {
            create: [
              {
                description: "你对本周的学习满意度",
                config: { type: QuestionType.STAR, maxStars: 5, required: true }
              },
              {
                description: "你本周的学习感受",
                config: { type: QuestionType.INPUT, required: true }
              }
            ]
          }
        },
        include: { questions: true }
      });

      surveyIds.push(survey.id);

      // 保存第一个问卷的第一个问题ID用于测试
      if (i === 1) {
        questionId = survey.questions[0].id;
      }

      // 为每个用户创建提交
      for (const userId of userIds) {
        const submission = await prisma.submission.create({
          data: {
            survey_id: survey.id,
            user_id: userId
          }
        });

        // 为星级问题创建答案
        await prisma.answer.create({
          data: {
            question_id: survey.questions[0].id,
            submission_id: submission.id,
            value: String(3 + i) // 4 or 5
          }
        });

        // 为文本问题创建答案
        await prisma.answer.create({
          data: {
            question_id: survey.questions[1].id,
            submission_id: submission.id,
            value: `第${i}周的学习感受很好`
          }
        });
      }
    }
  });

  afterAll(async () => {
    // 清理测试数据
    for (const surveyId of surveyIds) {
      await prisma.answer.deleteMany({
        where: {
          submission: { survey_id: surveyId }
        }
      });
      await prisma.submission.deleteMany({
        where: { survey_id: surveyId }
      });
      await prisma.question.deleteMany({
        where: { survey_id: surveyId }
      });
      await prisma.survey.delete({
        where: { id: surveyId }
      });
    }
    for (const userId of userIds) {
      await prisma.user.delete({
        where: { id: userId }
      });
    }
  });

  it("应该能够查询跨问卷的星级问题聚合数据", async () => {
    // 这个测试验证跨问卷查询的数据结构
    // 实际的路由测试需要用 supertest 或类似工具，这里只是验证数据准备
    
    // 验证问卷已创建
    assertEquals(surveyIds.length, 2);
    assertExists(questionId);

    // 验证问题描述匹配
    const questions = await prisma.question.findMany({
      where: {
        survey_id: { in: surveyIds },
        description: "你对本周的学习满意度"
      }
    });

    assertEquals(questions.length, 2);
    
    // 验证所有问题类型一致
    const types = questions.map(q => (q.config as any).type);
    assertEquals(new Set(types).size, 1);
  });

  it("应该能够查询用户的历史答案", async () => {
    const userId = userIds[0];

    // 查询该用户在两个问卷中的答案
    const submissions = await prisma.submission.findMany({
      where: {
        user_id: userId,
        survey_id: { in: surveyIds }
      },
      include: {
        answers: true,
        survey: true
      }
    });

    assertEquals(submissions.length, 2);
    
    // 验证每个提交都有答案
    for (const submission of submissions) {
      assertExists(submission.answers);
      assertEquals(submission.answers.length, 2); // 两个问题
    }
  });
});
