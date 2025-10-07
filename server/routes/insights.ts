// 跨问卷分析的 API 路由
import { Router } from "@oak/oak";
import { prisma } from "../db.ts";
import { CrossInsightResponse, UserWithSurveys, SurveysAnswersInsights, QuestionInsight, QuestionType } from "../types.ts";
import { needAdminAuthorization } from "../middleware/auth.ts";
import { cut } from "npm:jieba-wasm";

const insightsRouter = new Router();

// 获取跨问卷的某个问题的分析
insightsRouter.get("/:questionId", needAdminAuthorization, async (ctx) => {
  const questionId = parseInt(ctx.params.questionId);
  const url = new URL(ctx.request.url);
  const surveysParam = url.searchParams.get("surveys");

  if (!questionId) {
    ctx.response.status = 400;
    ctx.response.body = { error: "无效的问题ID" };
    return;
  }

  if (!surveysParam) {
    ctx.response.status = 400;
    ctx.response.body = { error: "缺少surveys参数" };
    return;
  }

  try {
    // 解析 survey IDs
    const surveyIds = surveysParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    
    if (surveyIds.length === 0) {
      ctx.response.status = 400;
      ctx.response.body = { error: "无效的surveys参数" };
      return;
    }

    // 获取所有相关的问题
    const questions = await prisma.question.findMany({
      where: {
        survey_id: { in: surveyIds },
        id: questionId
      },
      include: {
        survey: true
      }
    });

    if (questions.length === 0) {
      ctx.response.status = 404;
      ctx.response.body = { error: "问题不存在" };
      return;
    }

    // 获取第一个问卷的问题作为基准
    const firstQuestion = questions.find((q: any) => q.survey_id === surveyIds[0]);
    if (!firstQuestion) {
      ctx.response.status = 404;
      ctx.response.body = { error: "第一个问卷中不存在该问题" };
      return;
    }

    const baseConfig = firstQuestion.config as any;
    const questionType = baseConfig.type;

    // 检查所有问卷中该位置问题的类型是否一致
    for (const surveyId of surveyIds) {
      // 获取每个问卷的问题
      const surveyQuestions = await prisma.question.findMany({
        where: { survey_id: surveyId },
        orderBy: { id: 'asc' }
      });

      // 找到同一位置的问题（按创建顺序）
      const allQuestionsInFirstSurvey = await prisma.question.findMany({
        where: { survey_id: surveyIds[0] },
        orderBy: { id: 'asc' }
      });

      const positionInFirstSurvey = allQuestionsInFirstSurvey.findIndex((q: any) => q.id === questionId);
      if (positionInFirstSurvey === -1) {
        ctx.response.status = 400;
        ctx.response.body = { error: "无法确定问题位置" };
        return;
      }

      const correspondingQuestion = surveyQuestions[positionInFirstSurvey];
      if (!correspondingQuestion) {
        ctx.response.status = 400;
        ctx.response.body = { error: `问卷 ${surveyId} 中不存在对应位置的问题` };
        return;
      }

      const config = correspondingQuestion.config as any;
      if (config.type !== questionType) {
        ctx.response.status = 400;
        ctx.response.body = { error: `问卷 ${surveyId} 中对应问题的类型不匹配` };
        return;
      }
    }

    // 获取所有问卷中对应位置的问题ID
    const questionIdsBySurvey = new Map<number, number>();
    for (const surveyId of surveyIds) {
      const surveyQuestions = await prisma.question.findMany({
        where: { survey_id: surveyId },
        orderBy: { id: 'asc' }
      });

      const allQuestionsInFirstSurvey = await prisma.question.findMany({
        where: { survey_id: surveyIds[0] },
        orderBy: { id: 'asc' }
      });

      const positionInFirstSurvey = allQuestionsInFirstSurvey.findIndex((q: any) => q.id === questionId);
      const correspondingQuestion = surveyQuestions[positionInFirstSurvey];
      
      if (correspondingQuestion) {
        questionIdsBySurvey.set(surveyId, correspondingQuestion.id);
      }
    }

    // 获取所有相关的答案（限制前10个用户）
    const allAnswers = await prisma.answer.findMany({
      where: {
        question_id: { in: Array.from(questionIdsBySurvey.values()) }
      },
      include: {
        submission: {
          include: {
            user: true,
            survey: true
          }
        }
      },
      orderBy: {
        submission: {
          user_id: 'asc'
        }
      }
    });

    // 按用户分组并处理 insights
    const userMap = new Map<number, UserWithSurveys>();
    
    for (const answer of allAnswers) {
      const user = answer.submission.user!;
      const survey = answer.submission.survey;
      
      if (!userMap.has(user.id)) {
        userMap.set(user.id, {
          id: user.id,
          name: user.name,
          id_number: user.id_number,
          role: user.role,
          surveys: []
        });
      }
      
      // 根据问题类型处理 insight
      let answerInsight: QuestionInsight;
      
      if (questionType === QuestionType.STAR) {
        // 星级类型：直接返回数值
        answerInsight = {
          value: parseInt(answer.value)
        };
      } else if (questionType === QuestionType.INPUT) {
        // 文本类型：使用 jieba 分词生成词云
        const text = answer.value;
        const words = cut(text, true) as string[];
        
        // 统计词频
        const wordCount = new Map<string, number>();
        for (const word of words) {
          // 过滤单字和空白
          if (word.trim().length > 1) {
            wordCount.set(word, (wordCount.get(word) || 0) + 1);
          }
        }
        
        // 转换为数组并按频率排序，取前50个
        const sortedWords = Array.from(wordCount.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 50) as [string, number][];
        
        answerInsight = {
          words: sortedWords.map(([text, weight]) => ({ text, weight }))
        };
      } else {
        // 不支持的类型，跳过
        continue;
      }
      
      const userWithSurveys = userMap.get(user.id)!;
      userWithSurveys.surveys.push({
        survey_id: survey.id,
        week: survey.week,
        created_at: survey.created_at,
        answer_insight: answerInsight
      });
    }

    // 取前10个用户
    const users = Array.from(userMap.values()).slice(0, 10);

    const response: CrossInsightResponse = {
      questionType,
      users
    };

    ctx.response.status = 200;
    ctx.response.body = response;
  } catch (error) {
    console.error("获取跨问卷分析失败:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "获取跨问卷分析失败" };
  }
});

export { insightsRouter };
