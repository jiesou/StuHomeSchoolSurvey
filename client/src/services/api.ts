import axios from 'axios';
import type {
  Survey,
  CreateSurveyRequest,
  SubmitSurveyRequest,
  PaginatedResponse,
  Submission
} from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
});

export class ApiService {
  // Survey operations
  static async getSurveys(page = 1, limit = 10): Promise<PaginatedResponse<Survey>> {
    const response = await api.get(`/surveys?page=${page}&limit=${limit}`);
    return response.data;
  }

  static async getSurvey(id: string): Promise<Survey> {
    const response = await api.get(`/surveys/${id}`);
    return response.data;
  }

  static async createSurvey(data: CreateSurveyRequest): Promise<Survey> {
    const response = await api.post('/surveys', data);
    return response.data;
  }

  static async submitSurvey(surveyId: string, data: SubmitSurveyRequest): Promise<{ message: string; id: string }> {
    const response = await api.post(`/surveys/${surveyId}/submit`, data);
    return response.data;
  }

  static async getSurveyResults(surveyId: string, page = 1, limit = 50): Promise<PaginatedResponse<Submission>> {
    const response = await api.get(`/surveys/${surveyId}/results?page=${page}&limit=${limit}`);
    return response.data;
  }

  // User operations
  static async getUserByIdNumber(idNumber: string): Promise<any> {
    try {
      const response = await api.get(`/users/by-id-number/${idNumber}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }
}