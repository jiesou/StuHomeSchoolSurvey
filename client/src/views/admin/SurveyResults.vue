<template>
  <div>
    <a-page-header 
      :title="`${survey?.title || '...'}`"
      @back="goBack"
    />
    
    <a-descriptions bordered size="small" style="margin-bottom: 24px" :loading="loading">
      <a-descriptions-item label="学年">{{ survey?.year || '-' }}</a-descriptions-item>
      <a-descriptions-item label="学期">{{ survey ? (survey.semester === 1 ? '第一学期' : '第二学期') : '-' }}</a-descriptions-item>
      <a-descriptions-item label="周次">{{ survey ? `第${survey.week}周` : '-' }}</a-descriptions-item>
      <a-descriptions-item label="创建时间">{{ survey ? new Date(survey.created_at).toLocaleString() : '-' }}</a-descriptions-item>
      <a-descriptions-item label="问题数量">{{ survey?.questions?.length || 0 }}</a-descriptions-item>
      <a-descriptions-item label="回答人数">{{ submissionCount }}</a-descriptions-item>
    </a-descriptions>
    
    <a-tabs>
      <a-tab-pane key="submissions" tab="提交记录">
        <SubmissionsTable 
          :survey="survey"
          @total-change="submissionCount = $event"
        />
      </a-tab-pane>
      
      <a-tab-pane key="insights" tab="统计洞察">
        <SurveyInsights :survey="survey" />
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { apiService } from '../../api'
import type { Survey } from '../../types'
import SubmissionsTable from '../../components/SubmissionsTable.vue'
import SurveyInsights from '../../components/SurveyInsights.vue'

interface Props {
  id: string
}

const props = defineProps<Props>()

const router = useRouter()
const loading = ref(false)
const survey = ref<Survey | null>(null)
const submissionCount = ref(0)

const getAdminSecret = () => sessionStorage.getItem('adminSecret') || ''

const goBack = () => {
  router.push(`/admin-${getAdminSecret()}`)
}

async function loadData() {
  loading.value = true
  try {
    survey.value = await apiService.getSurvey(parseInt(props.id))
  } catch (error) {
    console.error('加载数据失败：', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>
