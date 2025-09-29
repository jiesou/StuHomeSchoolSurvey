// Shared types between frontend and backend

export interface User {
  id: string;
  name: string;
  idNumber: string;
  createdAt: Date;
}

export interface Survey {
  id: string;
  title: string;
  description?: string;
  year: number;
  semester: number;
  week: number;
  createdAt: Date;
  questions?: Question[];
  submissionCount?: number;
}

export interface Question {
  id: string;
  surveyId: string;
  description?: string;
  config: QuestionConfig;
  order: number;
}

export interface QuestionConfig {
  type: "star" | "input";
  required?: boolean;
  // Additional config based on type
  [key: string]: any;
}

export interface Answer {
  id: string;
  questionId: string;
  submissionId: string;
  value: string;
}

export interface Submission {
  id: string;
  surveyId: string;
  userId: string;
  createdAt: Date;
  user?: User;
  answers?: Answer[];
}

// API request/response types
export interface CreateSurveyRequest {
  title: string;
  description?: string;
  year: number;
  semester: number;
  week: number;
  questions: CreateQuestionRequest[];
}

export interface CreateQuestionRequest {
  description?: string;
  config: QuestionConfig;
  order: number;
}

export interface SubmitSurveyRequest {
  name: string;
  idNumber: string;
  answers: {
    questionId: string;
    value: string;
  }[];
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Question type guards
export function isStarQuestion(config: QuestionConfig): boolean {
  return config.type === "star";
}

export function isInputQuestion(config: QuestionConfig): boolean {
  return config.type === "input";
}

// Answer value parsers
export function parseStarAnswer(value: string): number {
  const num = parseInt(value, 10);
  return isNaN(num) ? 0 : Math.max(0, Math.min(5, num));
}

export function parseInputAnswer(value: string): string {
  return value.trim();
}