import { Application, Router } from "@oak/oak";
import { getLogger, setup as setupLogger, ConsoleHandler, LogLevel } from "@std/log";
import { SurveyService } from "./survey-service.ts";
import {
  CreateSurveyRequestSchema,
  SubmitSurveyRequestSchema,
  PaginationSchema,
  UUIDSchema,
  validateAnswerValue,
} from "./validation.ts";
import { disconnectDatabase } from "./database.ts";

// Setup logging
setupLogger({
  handlers: {
    console: new ConsoleHandler(LogLevel.INFO, {
      formatter: "{datetime} [{level}] {msg}",
    }),
  },
  loggers: {
    default: {
      level: LogLevel.INFO,
      handlers: ["console"],
    },
    "survey-service": {
      level: LogLevel.INFO,
      handlers: ["console"],
    },
    database: {
      level: LogLevel.INFO,
      handlers: ["console"],
    },
  },
});

const logger = getLogger();
const surveyService = new SurveyService();

const router = new Router();

// Health check endpoint
router.get("/api/health", (ctx) => {
  ctx.response.body = { status: "ok", timestamp: new Date().toISOString() };
});

// Get all surveys with pagination
router.get("/api/surveys", async (ctx) => {
  try {
    const url = new URL(ctx.request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10");
    
    const validation = PaginationSchema.safeParse({ page, pageSize });
    if (!validation.success) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Invalid pagination parameters" };
      return;
    }

    const result = await surveyService.getSurveys(page, pageSize);
    ctx.response.body = result;
  } catch (error) {
    logger.error(`Error getting surveys: ${error.message}`);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error" };
  }
});

// Create new survey
router.post("/api/surveys", async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value;
    
    const validation = CreateSurveyRequestSchema.safeParse(body);
    if (!validation.success) {
      ctx.response.status = 400;
      ctx.response.body = { 
        error: "Invalid request data",
        details: validation.error.errors,
      };
      return;
    }

    const surveyId = await surveyService.createSurvey(validation.data);
    ctx.response.status = 201;
    ctx.response.body = { id: surveyId };
  } catch (error) {
    logger.error(`Error creating survey: ${error.message}`);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error" };
  }
});

// Get survey by ID (for answering)
router.get("/api/surveys/:id", async (ctx) => {
  try {
    const id = ctx.params.id;
    
    const validation = UUIDSchema.safeParse(id);
    if (!validation.success) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Invalid survey ID" };
      return;
    }

    const survey = await surveyService.getSurveyById(id);
    if (!survey) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Survey not found" };
      return;
    }

    ctx.response.body = survey;
  } catch (error) {
    logger.error(`Error getting survey: ${error.message}`);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error" };
  }
});

// Submit survey response
router.post("/api/surveys/:id/submit", async (ctx) => {
  try {
    const id = ctx.params.id;
    const body = await ctx.request.body({ type: "json" }).value;
    
    const idValidation = UUIDSchema.safeParse(id);
    if (!idValidation.success) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Invalid survey ID" };
      return;
    }

    const validation = SubmitSurveyRequestSchema.safeParse(body);
    if (!validation.success) {
      ctx.response.status = 400;
      ctx.response.body = { 
        error: "Invalid request data",
        details: validation.error.errors,
      };
      return;
    }

    // Get survey to validate answers
    const survey = await surveyService.getSurveyById(id);
    if (!survey) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Survey not found" };
      return;
    }

    // Validate all answers against question configs
    const questionMap = new Map(survey.questions.map(q => [q.id, q.config]));
    for (const answer of validation.data.answers) {
      const config = questionMap.get(answer.questionId);
      if (!config || !validateAnswerValue(answer.value, config)) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Invalid answer value for question" };
        return;
      }
    }

    // Check if user already submitted
    const hasSubmitted = await surveyService.checkUserSubmission(
      id,
      validation.data.user.name,
      validation.data.user.idNumber
    );

    if (hasSubmitted) {
      ctx.response.status = 409;
      ctx.response.body = { error: "Survey already submitted by this user" };
      return;
    }

    await surveyService.submitSurvey(id, validation.data);
    ctx.response.status = 200;
    ctx.response.body = { success: true };
  } catch (error) {
    logger.error(`Error submitting survey: ${error.message}`);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error" };
  }
});

// Get survey results
router.get("/api/surveys/:id/results", async (ctx) => {
  try {
    const id = ctx.params.id;
    
    const validation = UUIDSchema.safeParse(id);
    if (!validation.success) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Invalid survey ID" };
      return;
    }

    const results = await surveyService.getSurveyResults(id);
    if (!results) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Survey not found" };
      return;
    }

    ctx.response.body = results;
  } catch (error) {
    logger.error(`Error getting survey results: ${error.message}`);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error" };
  }
});

// Check submission status
router.post("/api/surveys/:id/check", async (ctx) => {
  try {
    const id = ctx.params.id;
    const body = await ctx.request.body({ type: "json" }).value;
    
    const idValidation = UUIDSchema.safeParse(id);
    if (!idValidation.success) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Invalid survey ID" };
      return;
    }

    if (!body.name || !body.idNumber) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Name and ID number are required" };
      return;
    }

    const hasSubmitted = await surveyService.checkUserSubmission(id, body.name, body.idNumber);
    ctx.response.body = { hasSubmitted };
  } catch (error) {
    logger.error(`Error checking submission: ${error.message}`);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error" };
  }
});

const app = new Application();

// Error handling middleware
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    logger.error(`Unhandled error: ${err.message}`);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error" };
  }
});

// CORS middleware
app.use(async (ctx, next) => {
  ctx.response.headers.set("Access-Control-Allow-Origin", "*");
  ctx.response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  ctx.response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  if (ctx.request.method === "OPTIONS") {
    ctx.response.status = 200;
    return;
  }
  
  await next();
});

// Request logging middleware
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  logger.info(`${ctx.request.method} ${ctx.request.url} - ${ctx.response.status} - ${ms}ms`);
});

app.use(router.routes());
app.use(router.allowedMethods());

const port = parseInt(Deno.env.get("PORT") || "8000");

console.log(`🚀 Server starting on port ${port}`);
await app.listen({ port });

// Graceful shutdown
Deno.addSignalListener("SIGINT", async () => {
  logger.info("Shutting down server...");
  await disconnectDatabase();
  Deno.exit(0);
});

Deno.addSignalListener("SIGTERM", async () => {
  logger.info("Shutting down server...");
  await disconnectDatabase();
  Deno.exit(0);
});
