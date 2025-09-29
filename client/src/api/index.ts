// API 服务模块
import type { 
  Survey, 
  CreateSurveyRequest, 
  SurveyListResponse, 
  SurveyResultResponse,
  SubmitAnswersRequest 
} from '../types'

const API_BASE_URL = 'http://localhost:8000'

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const response = await fetch(url, {
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
    return this.request<SurveyListResponse>(`/api/surveys?page=${page}&limit=${limit}`)
  }

  // 获取问卷详情
  async getSurvey(id: number): Promise<Survey> {
    return this.request<Survey>(`/api/surveys/${id}`)
  }

  // 创建问卷
  async createSurvey(data: CreateSurveyRequest): Promise<Survey> {
    return this.request<Survey>('/api/surveys', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // 获取问卷结果
  async getSurveyResults(id: number, page = 1, limit = 20): Promise<SurveyResultResponse> {
    return this.request<SurveyResultResponse>(`/api/surveys/${id}/results?page=${page}&limit=${limit}`)
  }

  // 提交问卷答案
  async submitAnswers(data: SubmitAnswersRequest): Promise<any> {
    return this.request('/api/submissions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}

export const apiService = new ApiService()