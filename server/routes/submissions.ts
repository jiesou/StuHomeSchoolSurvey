// 提交答案相关的 API 路由
import { Router } from "@oak/oak";
import { prisma } from "../db.ts";
import { SubmitAnswersRequest, UserRole } from "../types.ts";

const submissionRouter = new Router();

// 提交问卷答案
submissionRouter.post("/", async (ctx) => {
  try {
    const body = await ctx.request.body.json() as SubmitAnswersRequest;
    
    if (!body.survey_id || !body.user?.name || !body.user?.id_number || !body.answers?.length) {
      ctx.response.status = 400;
      ctx.response.body = { error: "缺少必要字段" };
      return;
    }

    // 验证用户输入长度
    if (body.user.name.length > 100) {
      ctx.response.status = 400;
      ctx.response.body = { error: "姓名长度不能超过100个字符" };
      return;
    }
    if (body.user.id_number.length > 50) {
      ctx.response.status = 400;
      ctx.response.body = { error: "学号长度不能超过50个字符" };
      return;
    }

    // 检查问卷是否存在
    const survey = await prisma.survey.findUnique({
      where: { id: body.survey_id },
      include: { questions: true },
    });

    if (!survey) {
      ctx.response.status = 404;
      ctx.response.body = { error: "问卷不存在" };
      return;
    }

    // 查找或创建用户
    let user = await prisma.user.findUnique({
      where: {
        id_number: body.user.id_number,
      },
    });

    if (!user) {
      try {
        user = await prisma.user.create({
          data: {
            name: body.user.name,
            id_number: body.user.id_number,
            role: UserRole.STUDENT,
          },
        });
      } catch (createError: any) {
        // 处理学号重复的情况（可能是并发创建）
        if (createError.code === 'P2002') {
          ctx.response.status = 400;
          ctx.response.body = { error: "该学号已被其他用户使用，请核实学号和姓名" };
          return;
        }
        throw createError;
      }
    } else if (user.name !== body.user.name) {
      // 学号存在但姓名不匹配
      ctx.response.status = 400;
      ctx.response.body = { error: "学号和姓名不匹配，请核实您的学号和姓名" };
      return;
    }

    // 检查是否已经提交过
    const existingSubmission = await prisma.submission.findUnique({
      where: {
        survey_id_user_id: {
          survey_id: body.survey_id,
          user_id: user.id,
        },
      },
    });

    if (existingSubmission) {
      ctx.response.status = 409;
      ctx.response.body = { error: "您已经提交过这份问卷" };
      return;
    }

    // 验证答案是否对应问卷中的问题
    const questionIds = survey.questions.map((q: any) => q.id);
    const answerQuestionIds = body.answers.map(a => a.question_id);
    const invalidQuestionIds = answerQuestionIds.filter(id => !questionIds.includes(id));
    
    if (invalidQuestionIds.length > 0) {
      ctx.response.status = 400;
      ctx.response.body = { error: `无效的问题ID: ${invalidQuestionIds.join(', ')}` };
      return;
    }

    // 验证答案长度限制
    for (const answer of body.answers) {
      const question = survey.questions.find((q: any) => q.id === answer.question_id);
      if (question) {
        const config = question.config as any;
        if (config.maxLength && answer.value.length > config.maxLength) {
          ctx.response.status = 400;
          ctx.response.body = { error: `答案超出最大字符数限制（${config.maxLength}字符）` };
          return;
        }
      }
    }

    // 创建提交记录和答案
    const submission = await prisma.submission.create({
      data: {
        survey_id: body.survey_id,
        user_id: user.id,
        answers: {
          create: body.answers.map(answer => ({
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

    ctx.response.status = 201;
    ctx.response.body = submission;
  } catch (error) {
    console.error("提交答案失败:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "提交答案失败" };
  }
});

export { submissionRouter };