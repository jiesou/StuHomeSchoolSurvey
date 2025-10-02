// 问卷相关的 API 路由
import { Router } from "@oak/oak";
import { prisma } from "../db.ts";
import { CreateSurveyRequest, SurveyListResponse, SurveyResultResponse, Survey, Submission } from "../types.ts";

const surveyRouter = new Router();

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
surveyRouter.post("/", async (ctx) => {
  try {
    const body = await ctx.request.body.json() as CreateSurveyRequest;
    
    if (!body.title || !body.year || !body.semester || !body.week) {
      ctx.response.status = 400;
      ctx.response.body = { error: "缺少必要字段" };
      return;
    }

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
surveyRouter.put("/:id", async (ctx) => {
  const id = parseInt(ctx.params.id);
  if (!id) {
    ctx.response.status = 400;
    ctx.response.body = { error: "无效的问卷ID" };
    return;
  }

  try {
    const body = await ctx.request.body.json() as CreateSurveyRequest;
    
    if (!body.title || !body.year || !body.semester || !body.week) {
      ctx.response.status = 400;
      ctx.response.body = { error: "缺少必要字段" };
      return;
    }

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

export { surveyRouter };