import { Router } from "@oak/oak";
import * as log from "@std/log";
import { getPrismaClient } from "../database.ts";
import { 
  CreateSurveyRequest, 
  SubmitSurveyRequest, 
  PaginatedResponse, 
  Survey,
  Submission 
} from "../types.ts";

export const surveyRoutes = new Router();

// Get all surveys with pagination
surveyRoutes.get("/", async (ctx) => {
  const prisma = getPrismaClient();
  const url = new URL(ctx.request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "10"), 100);
  const offset = (page - 1) * limit;

  const [surveys, total] = await Promise.all([
    prisma.survey.findMany({
      skip: offset,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        questions: {
          orderBy: { order: "asc" }
        },
        _count: {
          select: { submissions: true }
        }
      }
    }),
    prisma.survey.count()
  ]);

  const result: PaginatedResponse<Survey> = {
    data: surveys.map(s => ({
      id: s.id,
      title: s.title,
      description: s.description,
      year: s.year,
      semester: s.semester,
      week: s.week,
      createdAt: s.createdAt,
      questions: s.questions,
      submissionCount: s._count.submissions
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };

  ctx.response.body = result;
});

// Get survey by ID
surveyRoutes.get("/:id", async (ctx) => {
  const prisma = getPrismaClient();
  const { id } = ctx.params;

  const survey = await prisma.survey.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { order: "asc" }
      }
    }
  });

  if (!survey) {
    ctx.response.status = 404;
    ctx.response.body = { error: "Survey not found" };
    return;
  }

  ctx.response.body = survey;
});

// Create new survey
surveyRoutes.post("/", async (ctx) => {
  const prisma = getPrismaClient();
  
  if (!ctx.request.hasBody) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Request body is required" };
    return;
  }
  
  const body = await ctx.request.body.json() as CreateSurveyRequest;

  // Validate request
  if (!body.title || !body.questions || body.questions.length === 0) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Title and questions are required" };
    return;
  }

  try {
    const survey = await prisma.survey.create({
      data: {
        title: body.title,
        description: body.description,
        year: body.year,
        semester: body.semester,
        week: body.week,
        questions: {
          create: body.questions.map(q => ({
            description: q.description,
            config: q.config,
            order: q.order
          }))
        }
      },
      include: {
        questions: {
          orderBy: { order: "asc" }
        }
      }
    });

    log.info(`Created survey: ${survey.id} - ${survey.title}`);
    ctx.response.status = 201;
    ctx.response.body = survey;
  } catch (error) {
    log.error(`Failed to create survey: ${error.message}`);
    ctx.response.status = 400;
    ctx.response.body = { error: "Failed to create survey" };
  }
});

// Submit survey response
surveyRoutes.post("/:id/submit", async (ctx) => {
  const prisma = getPrismaClient();
  const { id: surveyId } = ctx.params;
  
  if (!ctx.request.hasBody) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Request body is required" };
    return;
  }
  
  const body = await ctx.request.body.json() as SubmitSurveyRequest;

  // Validate request
  if (!body.name || !body.idNumber || !body.answers || body.answers.length === 0) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Name, ID number, and answers are required" };
    return;
  }

  try {
    // Check if survey exists
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      include: { questions: true }
    });

    if (!survey) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Survey not found" };
      return;
    }

    // Find or create user
    let user = await prisma.user.findFirst({
      where: { idNumber: body.idNumber }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: body.name,
          idNumber: body.idNumber
        }
      });
    }

    // Check if user already submitted this survey
    const existingSubmission = await prisma.submission.findUnique({
      where: {
        surveyId_userId: {
          surveyId,
          userId: user.id
        }
      }
    });

    if (existingSubmission) {
      ctx.response.status = 409;
      ctx.response.body = { error: "You have already submitted this survey" };
      return;
    }

    // Create submission with answers
    const submission = await prisma.submission.create({
      data: {
        surveyId,
        userId: user.id,
        answers: {
          create: body.answers.map(answer => ({
            questionId: answer.questionId,
            value: answer.value
          }))
        }
      },
      include: {
        answers: true,
        user: true
      }
    });

    log.info(`Submission created: ${submission.id} for survey ${surveyId} by user ${user.idNumber}`);
    ctx.response.status = 201;
    ctx.response.body = { message: "Survey submitted successfully", id: submission.id };
  } catch (error) {
    log.error(`Failed to submit survey: ${error.message}`);
    ctx.response.status = 400;
    ctx.response.body = { error: "Failed to submit survey" };
  }
});

// Get survey results
surveyRoutes.get("/:id/results", async (ctx) => {
  const prisma = getPrismaClient();
  const { id: surveyId } = ctx.params;
  const url = new URL(ctx.request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
  const offset = (page - 1) * limit;

  const [submissions, total] = await Promise.all([
    prisma.submission.findMany({
      where: { surveyId },
      skip: offset,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
        answers: {
          include: {
            question: true
          }
        }
      }
    }),
    prisma.submission.count({
      where: { surveyId }
    })
  ]);

  const result: PaginatedResponse<Submission> = {
    data: submissions.map(s => ({
      id: s.id,
      surveyId: s.surveyId,
      userId: s.userId,
      createdAt: s.createdAt,
      user: s.user,
      answers: s.answers
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };

  ctx.response.body = result;
});