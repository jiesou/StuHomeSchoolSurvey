// 问卷相关的 API 路由
import { Router, Context, Next } from "@oak/oak";
import { prisma } from "../db.ts";
import { CreateSurveyRequest, SurveyListResponse, SurveyResultResponse, Survey, Submission, QuestionInsight, QuestionType, QuestionConfig } from "../types.ts";
import { cut } from "npm:jieba-wasm";

const surveyRouter = new Router();

// 验证问卷输入的中间件
async function validateSurveyInput(ctx: Context, next: Next) {
  const body = await ctx.request.body.json() as CreateSurveyRequest;
  ctx.state.body = body;
  
  if (!body.title || !body.year || !body.semester || !body.week) {
    ctx.response.status = 400;
    ctx.response.body = { error: "缺少必要字段" };
    return;
  }

  // 验证字段长度
  if (body.title.length > 200) {
    ctx.response.status = 400;
    ctx.response.body = { error: "问卷标题不能超过200个字符" };
    return;
  }
  if (body.description && body.description.length > 1000) {
    ctx.response.status = 400;
    ctx.response.body = { error: "问卷描述不能超过1000个字符" };
    return;
  }
  if (body.year.length > 20) {
    ctx.response.status = 400;
    ctx.response.body = { error: "学年格式不正确" };
    return;
  }
  
  for (const question of body.questions) {
    if (question.description && question.description.length > 500) {
      ctx.response.status = 400;
      ctx.response.body = { error: "问题描述不能超过500个字符" };
      return;
    }
    
    // 类型检查和设置默认值
    const config = question.config as QuestionConfig;
    if (config.type === "input" && !config.maxLength) {
      config.maxLength = 10000;
    }
  }

  await next();
}

// 获取问卷列表（分页）
surveyRouter.get("/", async (ctx) => {
  const url = new URL(ctx.request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "10");

  try {
    const skip = (page - 1) * limit;
    
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

    const response: SurveyListResponse = {
      surveys: surveys as unknown as Survey[],
      total,
      page,
      limit,
    };

    ctx.response.status = 200;
    ctx.response.body = response;
  } catch (error) {
    console.error("获取问卷列表失败:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "获取问卷列表失败" };
  }
});

// 获取单个问卷详情
surveyRouter.get("/:id", async (ctx) => {
  const id = parseInt(ctx.params.id);
  if (!id) {
    ctx.response.status = 400;
    ctx.response.body = { error: "无效的问卷ID" };
    return;
  }

  try {
    const result = await prisma.survey.findUnique({
      where: { id },
      include: {
        questions: true,
      },
    });
    const survey = result as unknown as Survey | null;

    if (!survey) {
      ctx.response.status = 404;
      ctx.response.body = { error: "问卷不存在" };
      return;
    }

    ctx.response.status = 200;
    ctx.response.body = survey;
  } catch (error) {
    console.error("获取问卷详情失败:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "获取问卷详情失败" };
  }
});

// 创建新问卷
surveyRouter.post("/", validateSurveyInput, async (ctx) => {
  try {
    const body = ctx.state.body as CreateSurveyRequest;

    const result = await prisma.survey.create({
      data: {
        title: body.title,
        description: body.description,
        year: body.year,
        semester: body.semester,
        week: body.week,
        questions: {
          create: body.questions.map((q: any) => ({
            description: q.description,
            config: q.config,
          }))
        }
      },
      include: {
        questions: true,
      },
    });
    const survey = result as unknown as Survey;

    ctx.response.status = 201;
    ctx.response.body = survey;
  } catch (error) {
    console.error("创建问卷失败:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "创建问卷失败" };
  }
});

// 更新问卷
surveyRouter.put("/:id", validateSurveyInput, async (ctx) => {
  const id = parseInt(ctx.params.id);
  if (!id) {
    ctx.response.status = 400;
    ctx.response.body = { error: "无效的问卷ID" };
    return;
  }

  try {
    const body = ctx.state.body as CreateSurveyRequest;

    // 删除旧问题
    await prisma.question.deleteMany({
      where: { survey_id: id }
    });

    // 更新问卷和创建新问题
    const result = await prisma.survey.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        year: body.year,
        semester: body.semester,
        week: body.week,
        questions: {
          create: body.questions.map((q: any) => ({
            description: q.description,
            config: q.config,
          }))
        }
      },
      include: {
        questions: true,
      },
    });
    const survey = result as unknown as Survey;

    ctx.response.status = 200;
    ctx.response.body = survey;
  } catch (error) {
    console.error("更新问卷失败:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "更新问卷失败" };
  }
});

// 删除问卷
surveyRouter.delete("/:id", async (ctx) => {
  const id = parseInt(ctx.params.id);
  if (!id) {
    ctx.response.status = 400;
    ctx.response.body = { error: "无效的问卷ID" };
    return;
  }

  try {
    // 删除问卷（级联删除问题、提交和答案）
    await prisma.survey.delete({
      where: { id }
    });

    ctx.response.status = 200;
    ctx.response.body = { success: true, message: "问卷删除成功" };
  } catch (error) {
    console.error("删除问卷失败:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "删除问卷失败" };
  }
});

// 获取问卷结果
surveyRouter.get("/:id/results", async (ctx) => {
  const id = parseInt(ctx.params.id);
  if (!id) {
    ctx.response.status = 400;
    ctx.response.body = { error: "无效的问卷ID" };
    return;
  }

  const url = new URL(ctx.request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");

  try {
    const skip = (page - 1) * limit;
    
    const [survey, submissions, total] = await Promise.all([
      prisma.survey.findUnique({
        where: { id },
        include: { questions: true },
      }),
      prisma.submission.findMany({
        where: { survey_id: id },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          user: true,
          answers: true,
        },
      }),
      prisma.submission.count({
        where: { survey_id: id },
      })
    ]);

    if (!survey) {
      ctx.response.status = 404;
      ctx.response.body = { error: "问卷不存在" };
      return;
    }

    const response: SurveyResultResponse = {
      survey: survey as unknown as Survey,
      submissions: submissions as unknown as Submission[],
      total,
      page,
      limit,
    };

    ctx.response.status = 200;
    ctx.response.body = response;
  } catch (error) {
    console.error("获取问卷结果失败:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "获取问卷结果失败" };
  }
});

// 获取问卷某个问题的统计洞察
surveyRouter.get("/:id/insights/:questionId", async (ctx) => {
  const id = parseInt(ctx.params.id);
  const questionId = parseInt(ctx.params.questionId);

  if (!id || !questionId) {
    ctx.response.status = 400;
    ctx.response.body = { error: "无效的参数" };
    return;
  }

  try {
    // 获取问题配置
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question || question.survey_id !== id) {
      ctx.response.status = 404;
      ctx.response.body = { error: "问题不存在" };
      return;
    }

    const config = question.config as any;

    // 获取该问题的所有答案
    const answers = await prisma.answer.findMany({
      where: { 
        question_id: questionId,
        submission: {
          survey_id: id
        }
      },
      select: { value: true }
    });

    let insight: QuestionInsight;

    if (config.type === QuestionType.INPUT) {
      // 文本类型：生成词云数据
      const allText = answers.map((a: any) => a.value).join(' ');
      
      // 使用 jieba 分词
      const words = cut(allText, true) as string[];
      
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
      
      insight = {
        type: 'wordcloud',
        words: sortedWords.map(([text, weight]) => ({ text, weight })),
      };
    } else if (config.type === QuestionType.STAR) {
      // 星级类型：计算分布
      const distribution: Record<number, number> = {};
      const maxStars = config.maxStars || 5;
      
      // 初始化分布
      for (let i = 0; i <= maxStars; i++) {
        distribution[i] = 0;
      }
      
      // 统计分布
      let sum = 0;
      for (const answer of answers) {
        const star = parseInt(answer.value);
        if (!isNaN(star) && star >= 0 && star <= maxStars) {
          distribution[star]++;
          sum += star;
        }
      }
      
      insight = {
        type: 'star',
        distribution,
        average: answers.length > 0 ? sum / answers.length : 0,
        total: answers.length
      };
    } else {
      ctx.response.status = 400;
      ctx.response.body = { error: "不支持的问题类型" };
      return;
    }

    ctx.response.status = 200;
    ctx.response.body = insight;
  } catch (error) {
    console.error("获取问题统计失败:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "获取问题统计失败" };
  }
});

export { surveyRouter };
