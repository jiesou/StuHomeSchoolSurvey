<template>
  <div class="survey-results">
    <div class="page-header">
      <h1>问卷结果</h1>
      <router-link to="/admin" class="btn btn-secondary">返回</router-link>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
    
    <div v-else-if="error" class="alert alert-error">
      {{ error }}
    </div>

    <div v-else-if="results">
      <div class="results-header card">
        <h2>{{ results.title }}</h2>
        <div class="stats">
          <div class="stat">
            <span class="stat-value">{{ results.totalSubmissions }}</span>
            <span class="stat-label">总提交数</span>
          </div>
        </div>
      </div>

      <div v-for="(question, index) in results.questions" :key="question.id" class="question-result card">
        <h3 class="question-title">
          {{ index + 1 }}. {{ question.description || `问题 ${index + 1}` }}
        </h3>

        <!-- Star Rating Results -->
        <div v-if="question.config.type === 'star'" class="star-results">
          <div class="rating-summary">
            <div class="average-rating">
              <span class="rating-value">{{ getAverageRating(question.answers).toFixed(1) }}</span>
              <div class="rating-stars">
                <span 
                  v-for="star in question.config.maxRating"
                  :key="star"
                  :class="['star', { filled: star <= Math.round(getAverageRating(question.answers)) }]"
                >
                  ★
                </span>
              </div>
              <span class="rating-text">平均评分</span>
            </div>
          </div>

          <div class="rating-distribution">
            <h4>评分分布</h4>
            <div class="distribution-bars">
              <div 
                v-for="rating in question.config.maxRating + 1"
                :key="rating - 1"
                class="distribution-bar"
              >
                <span class="rating-label">{{ rating - 1 }}星</span>
                <div class="bar-container">
                  <div 
                    class="bar"
                    :style="{ width: getRatingPercentage(question.answers, rating - 1) + '%' }"
                  ></div>
                </div>
                <span class="count">{{ getRatingCount(question.answers, rating - 1) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Input Results -->
        <div v-else-if="question.config.type === 'input'" class="input-results">
          <div class="responses-count">
            共 {{ question.answers.length }} 条回答
          </div>
          
          <div class="responses-list">
            <div 
              v-for="(answer, answerIndex) in question.answers" 
              :key="answerIndex"
              class="response-item"
            >
              <div class="response-text">{{ (answer as { text: string }).text }}</div>
            </div>
          </div>

          <div v-if="question.answers.length === 0" class="no-responses">
            暂无回答
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { surveyApi } from '../api'
import type { SurveyResult, AnswerValue, StarAnswerValue } from '../types'

const route = useRoute()
const surveyId = route.params.id as string

const results = ref<SurveyResult | null>(null)
const loading = ref(true)
const error = ref('')

function getAverageRating(answers: AnswerValue[]): number {
  const starAnswers = answers as StarAnswerValue[]
  if (starAnswers.length === 0) return 0
  
  const total = starAnswers.reduce((sum, answer) => sum + answer.rating, 0)
  return total / starAnswers.length
}

function getRatingCount(answers: AnswerValue[], rating: number): number {
  const starAnswers = answers as StarAnswerValue[]
  return starAnswers.filter(answer => answer.rating === rating).length
}

function getRatingPercentage(answers: AnswerValue[], rating: number): number {
  const starAnswers = answers as StarAnswerValue[]
  if (starAnswers.length === 0) return 0
  
  const count = getRatingCount(answers, rating)
  return (count / starAnswers.length) * 100
}

async function loadResults() {
  try {
    loading.value = true
    error.value = ''
    
    const data = await surveyApi.getSurveyResults(surveyId)
    results.value = data
    
  } catch (err: any) {
    if (err.response?.status === 404) {
      error.value = '问卷不存在'
    } else {
      error.value = '加载结果失败'
    }
    console.error('Error loading results:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadResults()
})
</script>

<style scoped>
.survey-results {
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  color: #2c3e50;
  margin: 0;
}

.results-header {
  text-align: center;
  margin-bottom: 2rem;
}

.results-header h2 {
  margin-bottom: 1rem;
  color: #2c3e50;
}

.stats {
  display: flex;
  justify-content: center;
  gap: 2rem;
}

.stat {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 2rem;
  font-weight: bold;
  color: #007bff;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}

.question-result {
  margin-bottom: 2rem;
}

.question-title {
  color: #2c3e50;
  margin-bottom: 1.5rem;
}

.star-results {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.rating-summary {
  text-align: center;
}

.average-rating {
  display: inline-block;
  text-align: center;
}

.rating-value {
  display: block;
  font-size: 3rem;
  font-weight: bold;
  color: #007bff;
  margin-bottom: 0.5rem;
}

.rating-stars {
  margin-bottom: 0.5rem;
}

.star {
  font-size: 1.5rem;
  color: #ddd;
  margin: 0 2px;
}

.star.filled {
  color: #ffc107;
}

.rating-text {
  color: #666;
  font-size: 0.9rem;
}

.rating-distribution h4 {
  margin-bottom: 1rem;
  color: #2c3e50;
}

.distribution-bars {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.distribution-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.rating-label {
  min-width: 60px;
  font-size: 0.9rem;
  color: #666;
}

.bar-container {
  flex: 1;
  height: 20px;
  background: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
}

.bar {
  height: 100%;
  background: #007bff;
  border-radius: 10px;
  transition: width 0.3s ease;
}

.count {
  min-width: 40px;
  text-align: right;
  font-size: 0.9rem;
  color: #666;
}

.input-results {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.responses-count {
  color: #666;
  font-size: 0.9rem;
}

.responses-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 400px;
  overflow-y: auto;
}

.response-item {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #007bff;
}

.response-text {
  line-height: 1.6;
}

.no-responses {
  text-align: center;
  padding: 2rem;
  color: #666;
  background: #f8f9fa;
  border-radius: 8px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .star-results {
    flex-direction: column;
  }
  
  .distribution-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 0.25rem;
  }
  
  .rating-label,
  .count {
    min-width: auto;
    text-align: left;
  }
}
</style>