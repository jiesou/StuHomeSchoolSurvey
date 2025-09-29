<template>
  <div class="create-survey">
    <div class="page-header">
      <h1>创建问卷</h1>
      <router-link to="/admin" class="btn btn-secondary">返回</router-link>
    </div>

    <div v-if="success" class="alert alert-success">
      问卷创建成功！问卷链接：
      <a :href="surveyUrl" target="_blank">{{ surveyUrl }}</a>
    </div>

    <div v-if="error" class="alert alert-error">
      {{ error }}
    </div>

    <form @submit.prevent="createSurvey" class="survey-form">
      <div class="card">
        <h2>基本信息</h2>
        
        <div class="form-group">
          <label for="title">问卷标题 *</label>
          <input 
            id="title"
            v-model="form.title" 
            type="text" 
            class="form-control" 
            required 
            maxlength="255"
          />
        </div>

        <div class="form-group">
          <label for="description">问卷描述</label>
          <textarea 
            id="description"
            v-model="form.description" 
            class="form-control" 
            rows="3"
          ></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="year">学年 *</label>
            <select id="year" v-model="form.year" class="form-control" required>
              <option v-for="year in years" :key="year" :value="year">
                {{ year }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="semester">学期 *</label>
            <select id="semester" v-model="form.semester" class="form-control" required>
              <option value="1">上学期</option>
              <option value="2">下学期</option>
            </select>
          </div>

          <div class="form-group">
            <label for="week">周次 *</label>
            <select id="week" v-model="form.week" class="form-control" required>
              <option v-for="week in 20" :key="week" :value="week">
                第{{ week }}周
              </option>
            </select>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="questions-header">
          <h2>问题设置</h2>
          <button type="button" @click="addQuestion" class="btn btn-secondary">
            添加问题
          </button>
        </div>

        <div v-if="form.questions.length === 0" class="no-questions">
          还没有问题，点击"添加问题"开始创建
        </div>

        <div v-for="(question, index) in form.questions" :key="index" class="question-item">
          <div class="question-header">
            <h3>问题 {{ index + 1 }}</h3>
            <button type="button" @click="removeQuestion(index)" class="btn-remove">
              删除
            </button>
          </div>

          <div class="form-group">
            <label>问题描述</label>
            <input 
              v-model="question.description" 
              type="text" 
              class="form-control"
              placeholder="请输入问题描述（可选）"
            />
          </div>

          <div class="form-group">
            <label>问题类型</label>
            <select v-model="question.config.type" class="form-control">
              <option value="star">星级评价</option>
              <option value="input">文本输入</option>
            </select>
          </div>

          <!-- Star rating config -->
          <div v-if="question.config.type === 'star'" class="form-group">
            <label>最高评分</label>
            <select v-model="question.config.maxRating" class="form-control">
              <option v-for="rating in [3, 4, 5, 6, 7, 8, 9, 10]" :key="rating" :value="rating">
                {{ rating }} 星
              </option>
            </select>
          </div>

          <!-- Input config -->
          <div v-if="question.config.type === 'input'">
            <div class="form-group">
              <label>
                <input 
                  v-model="question.config.multiline" 
                  type="checkbox"
                />
                多行输入
              </label>
            </div>
            
            <div class="form-group">
              <label>最大字符数（可选）</label>
              <input 
                v-model.number="question.config.maxLength" 
                type="number" 
                class="form-control"
                min="1"
                max="5000"
                placeholder="不限制"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" :disabled="submitting" class="btn">
          {{ submitting ? '创建中...' : '创建问卷' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { surveyApi } from '../api'
import type { CreateSurveyRequest } from '../types'

const form = ref<CreateSurveyRequest>({
  title: '',
  description: '',
  year: new Date().getFullYear(),
  semester: 1,
  week: 1,
  questions: []
})

const submitting = ref(false)
const success = ref(false)
const error = ref('')

const years = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => currentYear + i)
})

const surveyUrl = ref('')

function addQuestion() {
  form.value.questions.push({
    description: '',
    config: { type: 'star', maxRating: 5 }
  })
}

function removeQuestion(index: number) {
  form.value.questions.splice(index, 1)
}

async function createSurvey() {
  if (form.value.questions.length === 0) {
    error.value = '至少需要添加一个问题'
    return
  }

  try {
    submitting.value = true
    error.value = ''
    
    const result = await surveyApi.createSurvey(form.value)
    
    success.value = true
    surveyUrl.value = `${window.location.origin}/survey/${result.id}`
    
    // Reset form
    form.value = {
      title: '',
      description: '',
      year: new Date().getFullYear(),
      semester: 1,
      week: 1,
      questions: []
    }
    
  } catch (err: any) {
    error.value = err.response?.data?.error || '创建问卷失败'
    console.error('Error creating survey:', err)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.create-survey {
  max-width: 800px;
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

.survey-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 1rem;
}

.questions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.questions-header h2 {
  margin: 0;
}

.no-questions {
  text-align: center;
  padding: 2rem;
  color: #666;
  background: #f8f9fa;
  border-radius: 8px;
}

.question-item {
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.question-header h3 {
  margin: 0;
  color: #2c3e50;
}

.btn-remove {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-remove:hover {
  background: #c82333;
}

.form-actions {
  text-align: center;
  padding: 2rem 0;
}

.form-actions .btn {
  font-size: 1.1rem;
  padding: 1rem 2rem;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .questions-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
}
</style>