// 问卷相关的 API 路由
import { Router } from "@oak/oak";
import { prisma } from "../db.ts";
import { CreateSurveyRequest, SurveyListResponse, SurveyResultResponse, Survey, Submission } from "../types.ts";
import { mockDataService } from "../mock-data.ts";

const surveyRouter = new Router();

// 检查是否使用模拟数据
const USE_MOCK_DATA = Deno.env.get("USE_MOCK_DATA") === "true"; // 默认使用模拟数据

// 获取问卷列表（分页）
surveyRouter.get("/api/surveys", async (ctx) => {
  const url = new URL(ctx.request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "10");

  try {
    let response: SurveyListResponse;
    
    if (USE_MOCK_DATA) {
      response = await mockDataService.getSurveys(page, limit);
    } else {
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

      response = {
        surveys: surveys as unknown as Survey[],
        total,
        page,
        limit,
      };
    }

    ctx.response.status = 200;
    ctx.response.body = response;
  } catch (error) {
    console.error("获取问卷列表失败:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "获取问卷列表失败" };
  }
});

// 获取单个问卷详情
surveyRouter.get("/api/surveys/:id", async (ctx) => {
  const id = parseInt(ctx.params.id);
  if (!id) {
    ctx.response.status = 400;
    ctx.response.body = { error: "无效的问卷ID" };
    return;
  }

  try {
    let survey: Survey | null;
    
    if (USE_MOCK_DATA) {
      survey = await mockDataService.getSurvey(id);
    } else {
      const result = await prisma.survey.findUnique({
        where: { id },
        include: {
          questions: true,
        },
      });
      survey = result as unknown as Survey;
    }

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
surveyRouter.post("/api/surveys", async (ctx) => {
  try {
    const body = await ctx.request.body.json() as CreateSurveyRequest;
    
    if (!body.title || !body.year || !body.semester || !body.week) {
      ctx.response.status = 400;
      ctx.response.body = { error: "缺少必要字段" };
      return;
    }

    let survey: Survey;
    
    if (USE_MOCK_DATA) {
      survey = await mockDataService.createSurvey(body);
    } else {
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
      survey = result as unknown as Survey;
    }

    ctx.response.status = 201;
    ctx.response.body = survey;
  } catch (error) {
    console.error("创建问卷失败:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "创建问卷失败" };
  }
});

// 获取问卷结果
surveyRouter.get("/api/surveys/:id/results", async (ctx) => {
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
    let response: SurveyResultResponse | null;
    
    if (USE_MOCK_DATA) {
      response = await mockDataService.getSurveyResults(id, page, limit);
    } else {
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
        response = null;
      } else {
        response = {
          survey: survey as unknown as Survey,
          submissions: submissions as unknown as Submission[],
          total,
          page,
          limit,
        };
      }
    }

    if (!response) {
      ctx.response.status = 404;
      ctx.response.body = { error: "问卷不存在" };
      return;
    }

    ctx.response.status = 200;
    ctx.response.body = response;
  } catch (error) {
    console.error("获取问卷结果失败:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "获取问卷结果失败" };
  }
});

export { surveyRouter };