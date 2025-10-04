<template>
  <div>
    <a-page-header 
      :title="`${survey?.title || '...'}`"
      @back="$router.push('/admin')"
    />
    
    <a-descriptions v-if="survey" bordered size="small" style="margin-bottom: 24px">
      <a-descriptions-item label="学年">{{ survey.year }}</a-descriptions-item>
      <a-descriptions-item label="学期">{{ survey.semester === 1 ? '第一学期' : '第二学期' }}</a-descriptions-item>
      <a-descriptions-item label="周次">第{{ survey.week }}周</a-descriptions-item>
      <a-descriptions-item label="创建时间">{{ new Date(survey.created_at).toLocaleString() }}</a-descriptions-item>
      <a-descriptions-item label="问题数量">{{ survey.questions?.length || 0 }}</a-descriptions-item>
      <a-descriptions-item label="回答人数">{{ pagination.total }}</a-descriptions-item>
    </a-descriptions>
    
    <ResultInsights :survey="survey" />
    
    <SubmissionsTable 
      :survey="survey"
      :submissions="submissions"
      :loading="loading"
      :pagination="pagination"
      @change="handleTableChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiService } from '../../api'
import type { Survey, Submission } from '../../types'
import SubmissionsTable from '../../components/SubmissionsTable.vue'
import ResultInsights from '../../components/ResultInsights.vue'

interface Props {
  id: string
}

const props = defineProps<Props>()

const loading = ref(false)
const survey = ref<Survey | null>(null)
const submissions = ref<Submission[]>([])
const pagination = ref({
  current: 1,
  pageSize: 20,
  pageSizeOptions: ['10', '20', '50'],
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`
})

async function loadData() {
  loading.value = true
  try {
    // 并行加载问卷信息和结果数据
    const [surveyData, resultsData] = await Promise.all([
      apiService.getSurvey(parseInt(props.id)),
      apiService.getSurveyResults(
        parseInt(props.id), 
        pagination.value.current, 
        pagination.value.pageSize
      )
    ])
    
    survey.value = surveyData
    submissions.value = resultsData.submissions
    pagination.value.total = resultsData.total
  } catch (error) {
    console.error('加载数据失败：', error)
  } finally {
    loading.value = false
  }
}

function handleTableChange(pag: any) {
  pagination.value.current = pag.current
  pagination.value.pageSize = pag.pageSize
  loadData()
}

onMounted(() => {
  loadData()
})
</script>
