export interface StarQuestionConfig {
  type: "star";
  maxRating: number;
}

export interface InputQuestionConfig {
  type: "input";
  multiline?: boolean;
  maxLength?: number;
}

export type QuestionConfig = StarQuestionConfig | InputQuestionConfig;

export interface StarAnswerValue {
  rating: number;
}

export interface InputAnswerValue {
  text: string;
}

export type AnswerValue = StarAnswerValue | InputAnswerValue;

export interface Survey {
  id: string;
  title: string;
  description: string | null;
  year: number;
  semester: number;
  week: number;
  createdAt: string;
  _count?: { submissions: number };
}

export interface SurveyWithQuestions extends Survey {
  questions: Question[];
}

export interface Question {
  id: string;
  description: string | null;
  config: QuestionConfig;
  orderIndex: number;
}

export interface CreateSurveyRequest {
  title: string;
  description?: string;
  year: number;
  semester: number;
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