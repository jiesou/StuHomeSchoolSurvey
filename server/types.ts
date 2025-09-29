// Question configuration types
export interface StarQuestionConfig {
  type: "star";
  maxRating: number; // 0-5 default
}

export interface InputQuestionConfig {
  type: "input";
  multiline?: boolean;
  maxLength?: number;
}

export type QuestionConfig = StarQuestionConfig | InputQuestionConfig;

// Answer value types
export interface StarAnswerValue {
  rating: number; // 0 to maxRating
}

export interface InputAnswerValue {
  text: string;
}

export type AnswerValue = StarAnswerValue | InputAnswerValue;

// API Request/Response types
export interface CreateSurveyRequest {
  title: string;
  description?: string;
  year: number;
  semester: number; // 1 or 2
  week: number;
  questions: {
    description?: string;
    config: QuestionConfig;
  }[];
}

export interface SubmitSurveyRequest {
  user: {
    name: string;
    idNumber: string;
  };
  answers: {
    questionId: string;
    value: AnswerValue;
  }[];
}

// Database result types
export interface SurveyWithQuestions {
  id: string;
  title: string;
  description: string | null;
  year: number;
  semester: number;
  week: number;
  createdAt: Date;
  questions: {
    id: string;
    description: string | null;
    config: QuestionConfig;
    orderIndex: number;
  }[];
}

export interface SurveyResult {
  id: string;
  title: string;
  totalSubmissions: number;
  questions: {
    id: string;
    description: string | null;
    config: QuestionConfig;
    answers: AnswerValue[];
  }[];
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}