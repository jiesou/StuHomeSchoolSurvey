import { getDatabase } from "./database.ts";
import { getLogger } from "@std/log";
import {
  CreateSurveyRequest,
  SubmitSurveyRequest,
  SurveyWithQuestions,
  SurveyResult,
  PaginatedResult,
  QuestionConfig,
  AnswerValue,
} from "./types.ts";

const logger = getLogger("survey-service");
const db = getDatabase();

export class SurveyService {
  async createSurvey(data: CreateSurveyRequest): Promise<string> {
    logger.info(`Creating new survey: ${data.title}`);
    
    const survey = await db.survey.create({
      data: {
        title: data.title,
        description: data.description,
        year: data.year,
        semester: data.semester,
        week: data.week,
        questions: {
          create: data.questions.map((q, index) => ({
            description: q.description,
            config: q.config as any,
            orderIndex: index,
          })),
        },
      },
    });

    logger.info(`Survey created with ID: ${survey.id}`);
    return survey.id;
  }

  async getSurveys(page: number = 1, pageSize: number = 10): Promise<PaginatedResult<{
    id: string;
    title: string;
    description: string | null;
    year: number;
    semester: number;
    week: number;
    createdAt: Date;
    _count: { submissions: number };
  }>> {
    const skip = (page - 1) * pageSize;
    
    const [surveys, total] = await Promise.all([
      db.survey.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { submissions: true },
          },
        },
      }),
      db.survey.count(),
    ]);

    return {
      data: surveys,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getSurveyById(id: string): Promise<SurveyWithQuestions | null> {
    const survey = await db.survey.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!survey) return null;

    return {
      ...survey,
      questions: survey.questions.map(q => ({
        ...q,
        config: q.config as QuestionConfig,
      })),
    };
  }

  async submitSurvey(surveyId: string, data: SubmitSurveyRequest): Promise<void> {
    logger.info(`Submitting survey ${surveyId} for user ${data.user.name}`);

    await db.$transaction(async (tx) => {
      // Find or create user
      let user = await tx.user.findFirst({
        where: {
          name: data.user.name,
          idNumber: data.user.idNumber,
        },
      });

      if (!user) {
        user = await tx.user.create({
          data: {
            name: data.user.name,
            idNumber: data.user.idNumber,
          },
        });
      }

      // Check if submission already exists
      const existingSubmission = await tx.submission.findUnique({
        where: {
          surveyId_userId: {
            surveyId,
            userId: user.id,
          },
        },
      });

      if (existingSubmission) {
        throw new Error("User has already submitted this survey");
      }

      // Create submission
      const submission = await tx.submission.create({
        data: {
          surveyId,
          userId: user.id,
        },
      });

      // Create answers
      await tx.answer.createMany({
        data: data.answers.map(answer => ({
          submissionId: submission.id,
          questionId: answer.questionId,
          value: JSON.stringify(answer.value),
        })),
      });
    });

    logger.info(`Survey submitted successfully for user ${data.user.name}`);
  }

  async getSurveyResults(surveyId: string): Promise<SurveyResult | null> {
    const survey = await db.survey.findUnique({
      where: { id: surveyId },
      include: {
        questions: {
          orderBy: { orderIndex: "asc" },
          include: {
            answers: {
              include: {
                submission: true,
              },
            },
          },
        },
        _count: {
          select: { submissions: true },
        },
      },
    });

    if (!survey) return null;

    return {
      id: survey.id,
      title: survey.title,
      totalSubmissions: survey._count.submissions,
      questions: survey.questions.map(question => ({
        id: question.id,
        description: question.description,
        config: question.config as QuestionConfig,
        answers: question.answers.map(answer => JSON.parse(answer.value) as AnswerValue),
      })),
    };
  }

  async checkUserSubmission(surveyId: string, name: string, idNumber: string): Promise<boolean> {
    const user = await db.user.findFirst({
      where: {
        name,
        idNumber,
      },
    });

    if (!user) return false;

    const submission = await db.submission.findUnique({
      where: {
        surveyId_userId: {
          surveyId,
          userId: user.id,
        },
      },
    });

    return !!submission;
  }
}