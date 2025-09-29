<template>
  <div class="survey-answer">
    <div v-if="loading" class="loading">加载中...</div>
    
    <div v-else-if="error" class="alert alert-error">
      {{ error }}
    </div>
    
    <div v-else-if="alreadySubmitted" class="card text-center">
      <h2>已经提交过了</h2>
      <p>您已经提交过这份问卷，感谢您的参与！</p>
      <router-link to="/" class="btn">返回首页</router-link>
    </div>

    <div v-else-if="submitted" class="card text-center">
      <h2>提交成功</h2>
      <p>感谢您的参与！您的反馈对我们很重要。</p>
      <router-link to="/" class="btn">返回首页</router-link>
    </div>

    <div v-else-if="survey">
      <div class="survey-header">
        <h1>{{ survey.title }}</h1>
        <div v-if="survey.description" class="survey-description">
          {{ survey.description }}
        </div>
        <div class="survey-meta">
          {{ survey.year }}学年 {{ survey.semester === 1 ? '上学期' : '下学期' }} 第{{ survey.week }}周
        </div>
      </div>

      <form @submit.prevent="submitSurvey" class="answer-form">
        <div class="card">
          <h3>个人信息</h3>
          <div class="form-row">
            <div class="form-group">
              <label for="name">姓名 *</label>
              <input 
                id="name"
                v-model="userInfo.name" 
                type="text" 
                class="form-control" 
                required 
                maxlength="100"
              />
            </div>
            
            <div class="form-group">
              <label for="idNumber">学号 *</label>
              <input 
                id="idNumber"
                v-model="userInfo.idNumber" 
                type="text" 
                class="form-control" 
                required 
                maxlength="50"
              />
            </div>
          </div>
        </div>

        <div class="card" v-for="(question, index) in survey.questions" :key="question.id">
          <div class="question">
            <h3 class="question-title">
              {{ index + 1 }}. {{ question.description || `问题 ${index + 1}` }}
            </h3>
            
            <!-- Star Rating Question -->
            <div v-if="question.config.type === 'star'" class="star-rating">
              <div class="rating-scale">
                <span 
                  v-for="rating in question.config.maxRating + 1" 
                  :key="rating - 1"
                  :class="['star', { active: getStarRating(question.id) >= rating - 1 }]"
                  @click="setStarRating(question.id, rating - 1)"
                >
                  ★
                </span>
              </div>
              <div class="rating-labels">
                <span>0</span>
                <span>{{ question.config.maxRating }}</span>
              </div>
              <div v-if="getStarRating(question.id) >= 0" class="rating-value">
                当前评分：{{ getStarRating(question.id) }}/{{ question.config.maxRating }}
              </div>
            </div>

            <!-- Input Question -->
            <div v-else-if="question.config.type === 'input'" class="text-input">
              <textarea 
                v-if="question.config.multiline"
                :value="getInputText(question.id)"
                @input="(answers[question.id] as InputAnswerValue).text = ($event.target as HTMLTextAreaElement).value"
                class="form-control"
                :maxlength="question.config.maxLength"
                rows="4"
                placeholder="请输入您的回答..."
              ></textarea>
              
              <input 
                v-else
                :value="getInputText(question.id)"
                @input="(answers[question.id] as InputAnswerValue).text = ($event.target as HTMLInputElement).value"
                type="text"
                class="form-control"
                :maxlength="question.config.maxLength"
                placeholder="请输入您的回答..."
              />
              
              <div v-if="question.config.maxLength" class="char-count">
                {{ getInputTextLength(question.id) }}/{{ question.config.maxLength }}
              </div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" :disabled="submitting || !canSubmit" class="btn">
            {{ submitting ? '提交中...' : '提交问卷' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { surveyApi } from '../api'
import type { SurveyWithQuestions, SubmitSurveyRequest, AnswerValue, StarAnswerValue, InputAnswerValue } from '../types'

function isStarAnswer(answer: AnswerValue): answer is StarAnswerValue {
  return 'rating' in answer
}

function isInputAnswer(answer: AnswerValue): answer is InputAnswerValue {
  return 'text' in answer
}

const route = useRoute()
const surveyId = route.params.id as string

const survey = ref<SurveyWithQuestions | null>(null)
const loading = ref(true)
const error = ref('')
const submitting = ref(false)
const submitted = ref(false)
const alreadySubmitted = ref(false)

const userInfo = reactive({
  name: '',
  idNumber: ''
})

const answers = reactive<Record<string, AnswerValue>>({})

const getStarRating = (questionId: string): number => {
  const answer = answers[questionId]
  return answer && isStarAnswer(answer) ? answer.rating : -1
}

const getInputText = (questionId: string): string => {
  const answer = answers[questionId]
  return answer && isInputAnswer(answer) ? answer.text : ''
}

const getInputTextLength = (questionId: string): number => {
  const text = getInputText(questionId)
  return text ? text.length : 0
}

const canSubmit = computed(() => {
  if (!userInfo.name.trim() || !userInfo.idNumber.trim()) return false
  if (!survey.value) return false
  
  // Check if all questions have answers
  return survey.value.questions.every(question => {
    const answer = answers[question.id]
    if (!answer) return false
    
    if (question.config.type === 'star') {
      return isStarAnswer(answer) && answer.rating !== undefined && answer.rating >= 0
    } else if (question.config.type === 'input') {
      return isInputAnswer(answer) && answer.text !== undefined && answer.text.trim().length > 0
    }
    
    return false
  })
})

function setStarRating(questionId: string, rating: number) {
  answers[questionId] = { rating }
}

async function loadSurvey() {
  try {
    loading.value = true
    error.value = ''
    
    const data = await surveyApi.getSurvey(surveyId)
    survey.value = data
    
    // Initialize answers
    data.questions.forEach(question => {
      if (question.config.type === 'star') {
        answers[question.id] = { rating: -1 }
      } else if (question.config.type === 'input') {
        answers[question.id] = { text: '' }
      }
    })
    
  } catch (err: any) {
    if (err.response?.status === 404) {
      error.value = '问卷不存在'
    } else {
      error.value = '加载问卷失败'
    }
    console.error('Error loading survey:', err)
  } finally {
    loading.value = false
  }
}

async function checkSubmission() {
  if (!userInfo.name.trim() || !userInfo.idNumber.trim()) return
  
  try {
    const result = await surveyApi.checkSubmission(surveyId, userInfo.name, userInfo.idNumber)
    if (result.hasSubmitted) {
      alreadySubmitted.value = true
    }
  } catch (err) {
    // Don't block submission if check fails
    console.error('Error checking submission:', err)
  }
}

async function submitSurvey() {
  // Check submission status first
  await checkSubmission()
  
  if (alreadySubmitted.value) return

  try {
    submitting.value = true
    error.value = ''
    
    const submission: SubmitSurveyRequest = {
      user: {
        name: userInfo.name.trim(),
        idNumber: userInfo.idNumber.trim()
      },
      answers: Object.entries(answers).map(([questionId, value]) => ({
        questionId,
        value
      }))
    }
    
    await surveyApi.submitSurvey(surveyId, submission)
    submitted.value = true
    
  } catch (err: any) {
    if (err.response?.status === 409) {
      alreadySubmitted.value = true
    } else {
      error.value = err.response?.data?.error || '提交失败，请重试'
    }
    console.error('Error submitting survey:', err)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadSurvey()
})
</script>

<style scoped>
.survey-answer {
  max-width: 800px;
  margin: 0 auto;
}

.survey-header {
  text-align: center;
  margin-bottom: 2rem;
}

.survey-header h1 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.survey-description {
  font-size: 1.1rem;
  color: #666;
  margin-bottom: 1rem;
}

.survey-meta {
  color: #888;
  font-size: 0.9rem;
}

.answer-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.question-title {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.star-rating {
  text-align: center;
}

.rating-scale {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.star {
  font-size: 2rem;
  color: #ddd;
  cursor: pointer;
  transition: color 0.2s;
  user-select: none;
}

.star:hover,
.star.active {
  color: #ffc107;
}

.rating-labels {
  display: flex;
  justify-content: space-between;
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.rating-value {
  color: #007bff;
  font-weight: 500;
}

.text-input {
  max-width: 100%;
}

.char-count {
  text-align: right;
  color: #666;
  font-size: 0.9rem;
  margin-top: 0.25rem;
}

.form-actions {
  text-align: center;
  padding: 2rem 0;
}

.form-actions .btn {
  font-size: 1.1rem;
  padding: 1rem 2rem;
  min-width: 150px;
}

.text-center {
  text-align: center;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .rating-scale {
    flex-wrap: wrap;
  }
  
  .star {
    font-size: 1.5rem;
  }
}
</style>