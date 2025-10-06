// 跨问卷洞察分析 API 路由
import { Router } from "@oak/oak";
import { prisma } from "../db.ts";
import { QuestionType } from "../types.ts";

const insightsRouter = new Router();

// 获取跨问卷的问题洞察
// GET /api/insights/:questionId?surveys=id1,id2,id3
insightsRouter.get("/:questionId", async (ctx) => {
  const questionId = parseInt(ctx.params.questionId);
  const surveyIdsParam = ctx.request.url.searchParams.get("surveys");
  
  if (!questionId || !surveyIdsParam) {
    ctx.response.status = 400;
    ctx.response.body = { error: "缺少必要参数：questionId 和 surveys" };
    return;
  }

  const surveyIds = surveyIdsParam.split(",").map(id => parseInt(id.trim())).filter(id => !isNaN(id));
  
  if (surveyIds.length === 0) {
    ctx.response.status = 400;
    ctx.response.body = { error: "无效的问卷ID列表" };
    return;
  }

  try {
    // 以第一个问卷作为基准，获取该问卷中的问题
    const baseQuestion = await prisma.question.findUnique({
      where: { id: questionId },
      include: { survey: true }
    });

    if (!baseQuestion) {
      ctx.response.status = 404;
      ctx.response.body = { error: "问题不存在" };
      return;
    }

    const baseQuestionConfig = baseQuestion.config as any;
    const baseQuestionType = baseQuestionConfig.type;

    // 获取所有问卷的该问题（通过描述匹配）
    const allQuestions = await prisma.question.findMany({
      where: {
        survey_id: { in: surveyIds },
        description: baseQuestion.description
      },
      include: {
        survey: true,
        answers: {
          include: {
            submission: {
              include: {
                user: true
              }
            }
          }
        }
      },
      orderBy: {
        survey: {
          created_at: 'asc'
        }
      }
    });

    // 验证所有问题类型是否一致
    for (const question of allQuestions) {
      const config = question.config as any;
      if (config.type !== baseQuestionType) {
        ctx.response.status = 400;
        ctx.response.body = { 
          error: `问题类型不一致：期望 ${baseQuestionType}，实际 ${config.type}` 
        };
        return;
      }
    }

    // 按用户聚合数据（固定前10个用户）
    const userAnswersMap = new Map<number, any>();

    for (const question of allQuestions) {
      for (const answer of question.answers as any[]) {
        const userId = answer.submission.user_id;
        const user = answer.submission.user;
        
        if (!userAnswersMap.has(userId)) {
          userAnswersMap.set(userId, {
            user: {
              id: user.id,
              name: user.name,
              id_number: user.id_number
            },
            histories: []
          });
        }

        const surveyData = {
          survey_id: question.survey_id,
          survey_created_at: question.survey.created_at,
          survey_year: question.survey.year,
          survey_semester: question.survey.semester,
          survey_week: question.survey.week,
          answer_value: answer.value
        };

        userAnswersMap.get(userId)!.histories.push(surveyData);
      }
    }

    // 只返回前10个用户
    const usersData = Array.from(userAnswersMap.values()).slice(0, 10);

    // 按时间排序每个用户的历史记录
    usersData.forEach(userData => {
      userData.histories.sort((a: any, b: any) => 
        new Date(a.survey_created_at).getTime() - new Date(b.survey_created_at).getTime()
      );
    });

    ctx.response.status = 200;
    ctx.response.body = {
      question: {
        id: baseQuestion.id,
        description: baseQuestion.description,
        config: baseQuestion.config
      },
      users: usersData,
      surveys: allQuestions.map(q => ({
        id: q.survey_id,
        title: q.survey.title,
        year: q.survey.year,
        semester: q.survey.semester,
        week: q.survey.week,
        created_at: q.survey.created_at
      }))
    };
  } catch (error) {
    console.error("获取跨问卷洞察失败:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "获取跨问卷洞察失败" };
  }
});

export { insightsRouter };
