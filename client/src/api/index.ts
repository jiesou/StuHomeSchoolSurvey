// API 服务模块
import type { 
  Survey, 
  CreateSurveyRequest, 
  SurveyListResponse, 
  SurveyResultResponse,
  SubmitAnswersRequest,
  QuestionInsight
} from '../types'


class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`/api/${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: '网络错误' }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // 获取问卷列表
  async getSurveys(page = 1, limit = 10): Promise<SurveyListResponse> {
    return this.request<SurveyListResponse>(`surveys?page=${page}&limit=${limit}`)
  }

  // 获取问卷详情
  async getSurvey(id: number): Promise<Survey> {
    return this.request<Survey>(`surveys/${id}`)
  }

  // 创建问卷
  async createSurvey(data: CreateSurveyRequest): Promise<Survey> {
    return this.request<Survey>('surveys', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // 更新问卷
  async updateSurvey(id: number, data: CreateSurveyRequest): Promise<Survey> {
    return this.request<Survey>(`surveys/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // 删除问卷
  async deleteSurvey(id: number): Promise<{ success: boolean, message: string }> {
    return this.request<{ success: boolean, message: string }>(`surveys/${id}`, {
      method: 'DELETE',
    })
  }

  // 获取问卷结果
  async getSurveyResults(id: number, page = 1, limit = 20): Promise<SurveyResultResponse> {
    return this.request<SurveyResultResponse>(`surveys/${id}/results?page=${page}&limit=${limit}`)
  }

  // 提交问卷答案
  async submitAnswers(data: SubmitAnswersRequest): Promise<any> {
    return this.request('submissions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // 获取问题统计洞察
  async getQuestionInsight(surveyId: number, questionId: number): Promise<QuestionInsight> {
    return this.request<QuestionInsight>(`surveys/${surveyId}/insights/${questionId}`)
  }
}

export const apiService = new ApiService()