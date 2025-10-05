// 提交答案相关的 API 路由
import { Router, Context, Next } from "@oak/oak";
import { prisma } from "../db.ts";
import { SubmitAnswersRequest, UserRole } from "../types.ts";

const submissionRouter = new Router();

// 查找或创建用户的中间件
async function ensureUserExists(ctx: Context, next: Next) {
  const body = await ctx.request.body.json() as SubmitAnswersRequest;
  
  if (!body.survey_id || !body.user?.name || !body.user?.id_number || !body.answers?.length) {
    ctx.response.status = 400;
    ctx.response.body = { error: "缺少必要字段" };
    return;
  }
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

  // 查找用户
  let user = await prisma.user.findUnique({
    where: {
      id_number: body.user.id_number,
    },
  });

  if (!user) {
    try {
      // 创建新用户
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
        ctx.response.body = { error: "学号被占用，请重试" };
        return;
      }
      throw createError;
    }
  } else if (user.name !== body.user.name) {
    // 学号存在但姓名不匹配
    ctx.response.status = 400;
    ctx.response.body = { error: "学号和姓名不匹配" };
    return;
  }

  ctx.state.user = user;
  await next();
}

// 提交问卷答案
submissionRouter.post("/", ensureUserExists, async (ctx) => {
  try {
    const body = await ctx.request.body.json() as SubmitAnswersRequest;
    const user = ctx.state.user;

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

    // 验证答案是否对应问卷中的问题，同时验证答案长度
    const questionIds = new Set(survey.questions.map((q: any) => q.id));
    const questionMap = new Map(survey.questions.map((q: any) => [q.id, q]));
    
    for (const answer of body.answers) {
      if (!questionIds.has(answer.question_id)) {
        ctx.response.status = 400;
        ctx.response.body = { error: `无效的问题ID: ${answer.question_id}` };
        return;
      }
      
      const question = questionMap.get(answer.question_id);
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
