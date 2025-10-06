// 跨问卷聚合分析路由
import { Router } from "@oak/oak";
import { prisma } from "../db.ts";
import { needAdminAuthorization } from "../middleware/auth.ts";
import { QuestionType } from "../types.ts";

const insightsRouter = new Router();

// 获取跨问卷的问题聚合分析
// GET /insights/:questionId?surveys=1,2,3
insightsRouter.get("/:questionId", needAdminAuthorization, async (ctx) => {
  const questionId = parseInt(ctx.params.questionId);
  const url = new URL(ctx.request.url);
  const surveysParam = url.searchParams.get("surveys");

  if (!questionId || !surveysParam) {
    ctx.response.status = 400;
    ctx.response.body = { error: "缺少必要参数" };
    return;
  }

  const surveyIds = surveysParam.split(",").map(id => parseInt(id.trim())).filter(id => !isNaN(id));

  if (surveyIds.length === 0) {
    ctx.response.status = 400;
    ctx.response.body = { error: "无效的问卷ID列表" };
    return;
  }

  try {
    // 获取每个问卷中对应的问题
    const questions = await prisma.question.findMany({
      where: {
        survey_id: { in: surveyIds },
        description: {
          equals: (await prisma.question.findUnique({ where: { id: questionId } }))?.description
        }
      },
      include: {
        survey: true
      }
    });

    if (questions.length === 0) {
      ctx.response.status = 404;
      ctx.response.body = { error: "未找到匹配的问题" };
      return;
    }

    // 检查所有问题类型是否一致
    const firstType = (questions[0].config as any).type;
    const allSameType = questions.every(q => (q.config as any).type === firstType);

    if (!allSameType) {
      ctx.response.status = 400;
      ctx.response.body = { error: "问题类型不一致，无法进行聚合分析" };
      return;
    }

    // 获取前10个用户
    const users = await prisma.user.findMany({
      take: 10,
      orderBy: { id: 'asc' }
    });

    // 构建结果：users[1-10].surveys[histories]: AnswerValue
    const result = await Promise.all(users.map(async (user) => {
      const histories = await Promise.all(questions.map(async (question) => {
        const answer = await prisma.answer.findFirst({
          where: {
            question_id: question.id,
            submission: {
              user_id: user.id,
              survey_id: question.survey_id
            }
          }
        });

        return {
          survey_id: question.survey_id,
          survey_title: question.survey.title,
          survey_year: question.survey.year,
          survey_semester: question.survey.semester,
          survey_week: question.survey.week,
          survey_created_at: question.survey.created_at,
          answer_value: answer?.value || null
        };
      }));

      return {
        user_id: user.id,
        user_name: user.name,
        user_id_number: user.id_number,
        histories
      };
    }));

    ctx.response.status = 200;
    ctx.response.body = {
      question_type: firstType,
      question_description: questions[0].description,
      users: result
    };
  } catch (error) {
    console.error("获取跨问卷分析失败:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "获取跨问卷分析失败" };
  }
});

export { insightsRouter };
