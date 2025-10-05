// 共享类型定义，供前后端使用

// 用户角色枚举
export enum UserRole {
  STUDENT = 1,
  TEACHER = 10,
}

// 问题类型枚举
export enum QuestionType {
  STAR = "star",     // 星级评分 (0-5星)
  INPUT = "input",   // 文本输入
}

// 问题配置接口
export interface QuestionConfig {
  type: QuestionType;
  // 其他配置可以根据类型扩展
  maxStars?: number;     // 星级评分最大星数，默认5
  placeholder?: string;  // 文本输入提示
  required?: boolean;    // 是否必填
  maxLength?: number;    // input 类型最大字符数
}

// 基础数据类型
export interface User {
  id: number;
  name: string;
  id_number: string;
  role: UserRole;
}

export interface Survey {
  id: number;
  title: string;
  description?: string | null;
  year: string;
  semester: number;
  week: number;
  created_at: Date;
  questions?: Question[];
}

export interface Question {
  id: number;
  survey_id: number;
  description?: string | null;
  config: QuestionConfig;
}

export interface Answer {
  id: number;
  question_id: number;
  submission_id: number;
  value: string;
}

export interface Submission {
  id: number;
  survey_id: number;
  user_id: number;
  created_at: Date;
  user?: User;
  answers?: Answer[];
}

// API 请求/响应类型
export interface CreateSurveyRequest {
  title: string;
  description?: string | null;
  year: string;
  semester: number;
  week: number;
  questions: Omit<Question, 'id' | 'survey_id'>[];
}

export interface CreateUserRequest {
  name: string;
  id_number: string;
  role: UserRole;
}

export interface SubmitAnswersRequest {
  survey_id: number;
  user: {
    name: string;
    id_number: string;
  };
  answers: {
    question_id: number;
    value: string;
  }[];
}

export interface SurveyListResponse {
  surveys: Survey[];
  total: number;
  page: number;
  limit: number;
}

export interface SurveyResultResponse {
  survey: Survey;
  submissions: Submission[];
  total: number;
  page: number;
  limit: number;
}

// 统计洞察相关类型
export interface WordCloudInsight {
  type: 'wordcloud';
  words: { text: string; weight: number; color?: string; }[];
}

export interface StarDistributionInsight {
  type: 'star';
  distribution: Record<number, number>; // { star: count }
  average: number;
  total: number;
}

export type QuestionInsight = WordCloudInsight | StarDistributionInsight;

// 工具函数类型
export type AnswerValue<T extends QuestionType> = 
  T extends QuestionType.STAR ? number :
  T extends QuestionType.INPUT ? string :
  string;

// 解析答案值的工具函数
export function parseAnswerValue(answer: Answer, config: QuestionConfig): string | number {
  switch (config.type) {
    case QuestionType.STAR:
      return parseInt(answer.value, 10);
    case QuestionType.INPUT:
      return answer.value;
    default:
      return answer.value;
  }
}