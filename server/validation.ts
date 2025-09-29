import { z } from "zod";

// Question config schemas
const StarQuestionConfigSchema = z.object({
  type: z.literal("star"),
  maxRating: z.number().int().min(1).max(10).default(5),
});

const InputQuestionConfigSchema = z.object({
  type: z.literal("input"),
  multiline: z.boolean().optional(),
  maxLength: z.number().int().positive().optional(),
});

export const QuestionConfigSchema = z.discriminatedUnion("type", [
  StarQuestionConfigSchema,
  InputQuestionConfigSchema,
]);

// Answer value schemas
const StarAnswerValueSchema = z.object({
  rating: z.number().int().min(0),
});

const InputAnswerValueSchema = z.object({
  text: z.string(),
});

export const AnswerValueSchema = z.union([
  StarAnswerValueSchema,
  InputAnswerValueSchema,
]);

// Request schemas
export const CreateSurveyRequestSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  year: z.number().int().min(2020).max(2030),
  semester: z.number().int().min(1).max(2),
  week: z.number().int().min(1).max(20),
  questions: z.array(z.object({
    description: z.string().optional(),
    config: QuestionConfigSchema,
  })).min(1).max(50),
});

export const SubmitSurveyRequestSchema = z.object({
  user: z.object({
    name: z.string().min(1).max(100),
    idNumber: z.string().min(1).max(50),
  }),
  answers: z.array(z.object({
    questionId: z.string().uuid(),
    value: AnswerValueSchema,
  })).min(1),
});

// Query parameter schemas
export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
});

export const UUIDSchema = z.string().uuid();

// Validation helper function
export function validateAnswerValue(value: unknown, config: any): boolean {
  try {
    if (config.type === "star") {
      const parsed = StarAnswerValueSchema.parse(value);
      return parsed.rating >= 0 && parsed.rating <= config.maxRating;
    } else if (config.type === "input") {
      const parsed = InputAnswerValueSchema.parse(value);
      if (config.maxLength && parsed.text.length > config.maxLength) {
        return false;
      }
      return true;
    }
    return false;
  } catch {
    return false;
  }
}