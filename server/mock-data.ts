// 模拟数据服务 - 用于演示
import { Survey, Question, Submission, CreateSurveyRequest, SubmitAnswersRequest, QuestionType } from './types.ts';

// 模拟数据存储
let mockSurveys: Survey[] = [
  {
    id: 1,
    title: "期中教学质量调研",
    description: "请家长对本学期前半段的教学质量进行评价",
    year: "2023-2024",
    semester: 1,
    week: 10,
    created_at: new Date("2024-03-15T10:00:00Z"),
    questions: [
      {
        id: 1,
        survey_id: 1,
        description: "您对孩子的学习进度满意吗？",
        config: { type: QuestionType.STAR, maxStars: 5, required: true }
      },
      {
        id: 2,
        survey_id: 1,
        description: "您对老师的教学方式有什么建议？",
        config: { type: QuestionType.INPUT, placeholder: "请输入您的建议", required: false }
      }
    ]
  },
  {
    id: 2,
    title: "课外活动参与意愿调查",
    description: "了解学生对课外活动的兴趣和参与意愿",
    year: "2023-2024",
    semester: 1,
    week: 12,
    created_at: new Date("2024-03-20T14:30:00Z"),
    questions: [
      {
        id: 3,
        survey_id: 2,
        description: "您的孩子对哪些课外活动感兴趣？",
        config: { type: QuestionType.INPUT, placeholder: "如：音乐、体育、科技等", required: true }
      }
    ]
  }
];

let mockSubmissions: Submission[] = [
  {
    id: 1,
    survey_id: 1,
    user_id: 1,
    created_at: new Date("2024-03-16T09:30:00Z"),
    user: {
      id: 1,
      name: "张三",
      id_number: "2023001",
      role: 1
    },
    answers: [
      {
        id: 1,
        question_id: 1,
        submission_id: 1,
        value: "4"
      },
      {
        id: 2,
        question_id: 2,
        submission_id: 1,
        value: "希望老师能多关注孩子的个性发展"
      }
    ]
  }
];

let nextSurveyId = 3;
let nextSubmissionId = 2;
let nextQuestionId = 4;
let nextUserId = 2;

export class MockDataService {
  // 获取问卷列表
  async getSurveys(page: number = 1, limit: number = 10) {
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedSurveys = mockSurveys.slice(start, end);
    
    return {
      surveys: paginatedSurveys,
      total: mockSurveys.length,
      page,
      limit
    };
  }

  // 获取单个问卷
  async getSurvey(id: number) {
    return mockSurveys.find(s => s.id === id) || null;
  }

  // 创建问卷
  async createSurvey(data: CreateSurveyRequest) {
    const survey: Survey = {
      id: nextSurveyId++,
      title: data.title,
      description: data.description,
      year: data.year,
      semester: data.semester,
      week: data.week,
      created_at: new Date(),
      questions: data.questions.map(q => ({
        id: nextQuestionId++,
        survey_id: nextSurveyId - 1,
        description: q.description,
        config: q.config
      }))
    };

    mockSurveys.push(survey);
    return survey;
  }

  // 获取问卷结果
  async getSurveyResults(surveyId: number, page: number = 1, limit: number = 20) {
    const survey = mockSurveys.find(s => s.id === surveyId);
    if (!survey) return null;

    const surveySubmissions = mockSubmissions.filter(s => s.survey_id === surveyId);
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedSubmissions = surveySubmissions.slice(start, end);

    return {
      survey,
      submissions: paginatedSubmissions,
      total: surveySubmissions.length,
      page,
      limit
    };
  }

  // 提交答案
  async submitAnswers(data: SubmitAnswersRequest) {
    // 检查问卷是否存在
    const survey = mockSurveys.find(s => s.id === data.survey_id);
    if (!survey) {
      throw new Error("问卷不存在");
    }

    // 检查是否已提交
    const existingSubmission = mockSubmissions.find(s => 
      s.survey_id === data.survey_id && 
      s.user?.name === data.user.name && 
      s.user?.id_number === data.user.id_number
    );

    if (existingSubmission) {
      throw new Error("您已经提交过这份问卷");
    }

    // 创建提交记录
    const submission: Submission = {
      id: nextSubmissionId++,
      survey_id: data.survey_id,
      user_id: nextUserId++,
      created_at: new Date(),
      user: {
        id: nextUserId - 1,
        name: data.user.name,
        id_number: data.user.id_number,
        role: 1
      },
      answers: data.answers.map(a => ({
        id: Math.random(),
        question_id: a.question_id,
        submission_id: nextSubmissionId - 1,
        value: a.value
      }))
    };

    mockSubmissions.push(submission);
    return submission;
  }
}

export const mockDataService = new MockDataService();