import axios from 'axios';
import type {
  Survey,
  SurveyWithQuestions,
  CreateSurveyRequest,
  SubmitSurveyRequest,
  SurveyResult,
  PaginatedResult
} from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const surveyApi = {
  // Get surveys with pagination
  async getSurveys(page = 1, pageSize = 10): Promise<PaginatedResult<Survey>> {
    const response = await api.get(`/api/surveys?page=${page}&pageSize=${pageSize}`);
    return response.data;
  },

  // Create a new survey
  async createSurvey(survey: CreateSurveyRequest): Promise<{ id: string }> {
    const response = await api.post('/api/surveys', survey);
    return response.data;
  },

  // Get survey by ID (for answering)
  async getSurvey(id: string): Promise<SurveyWithQuestions> {
    const response = await api.get(`/api/surveys/${id}`);
    return response.data;
  },

  // Submit survey answers
  async submitSurvey(id: string, submission: SubmitSurveyRequest): Promise<{ success: boolean }> {
    const response = await api.post(`/api/surveys/${id}/submit`, submission);
    return response.data;
  },

  // Get survey results
  async getSurveyResults(id: string): Promise<SurveyResult> {
    const response = await api.get(`/api/surveys/${id}/results`);
    return response.data;
  },

  // Check if user already submitted
  async checkSubmission(id: string, name: string, idNumber: string): Promise<{ hasSubmitted: boolean }> {
    const response = await api.post(`/api/surveys/${id}/check`, { name, idNumber });
    return response.data;
  },

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await api.get('/api/health');
    return response.data;
  },
};

export default api;