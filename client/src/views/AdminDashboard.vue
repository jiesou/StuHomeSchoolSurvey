<template>
  <div class="admin-dashboard">
    <div class="dashboard-header">
      <h1>管理后台</h1>
      <router-link to="/admin/create" class="btn">创建问卷</router-link>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
    
    <div v-else-if="error" class="alert alert-error">
      {{ error }}
    </div>

    <div v-else>
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>标题</th>
              <th>学年/学期/周</th>
              <th>创建时间</th>
              <th>提交数量</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="survey in surveys" :key="survey.id">
              <td>
                <strong>{{ survey.title }}</strong>
                <div v-if="survey.description" class="survey-description">
                  {{ survey.description }}
                </div>
              </td>
              <td>{{ survey.year }}/{{ survey.semester === 1 ? '上' : '下' }}/{{ survey.week }}</td>
              <td>{{ formatDate(survey.createdAt) }}</td>
              <td>{{ survey._count?.submissions || 0 }}</td>
              <td>
                <div class="actions">
                  <a :href="getSurveyUrl(survey.id)" target="_blank" class="btn btn-secondary btn-sm">
                    预览
                  </a>
                  <router-link :to="`/admin/results/${survey.id}`" class="btn btn-sm">
                    查看结果
                  </router-link>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination" v-if="totalPages > 1">
        <button 
          :disabled="currentPage <= 1" 
          @click="loadPage(currentPage - 1)"
        >
          上一页
        </button>
        
        <button 
          v-for="page in displayPages" 
          :key="page"
          :class="{ active: page === currentPage }"
          @click="loadPage(page)"
        >
          {{ page }}
        </button>
        
        <button 
          :disabled="currentPage >= totalPages" 
          @click="loadPage(currentPage + 1)"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { surveyApi } from '../api'
import type { Survey } from '../types'

const surveys = ref<Survey[]>([])
const loading = ref(true)
const error = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const pageSize = 10

const displayPages = computed(() => {
  const pages = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

async function loadSurveys(page = 1) {
  try {
    loading.value = true
    error.value = ''
    
    const result = await surveyApi.getSurveys(page, pageSize)
    surveys.value = result.data
    currentPage.value = result.page
    totalPages.value = result.totalPages
  } catch (err) {
    error.value = '加载问卷列表失败'
    console.error('Error loading surveys:', err)
  } finally {
    loading.value = false
  }
}

function loadPage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    loadSurveys(page)
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN')
}

function getSurveyUrl(surveyId: string): string {
  return `${window.location.origin}/survey/${surveyId}`
}

onMounted(() => {
  loadSurveys()
})
</script>

<style scoped>
.admin-dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.dashboard-header h1 {
  color: #2c3e50;
  margin: 0;
}

.table-container {
  overflow-x: auto;
  margin-bottom: 2rem;
}

.survey-description {
  font-size: 0.9rem;
  color: #666;
  margin-top: 0.25rem;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .actions {
    flex-direction: column;
  }
}
</style>