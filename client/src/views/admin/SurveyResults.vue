<template>
  <div>
    <a-page-header 
      :title="`问卷结果：${survey?.title || '...'}`"
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
    
    <a-table 
      :dataSource="submissions" 
      :columns="columns"
      :pagination="pagination"
      :loading="loading"
      @change="handleTableChange"
      rowKey="id"
      :scroll="{ x: 70+120+160+(survey?.questions?.length || 0)*150 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'submitted_at'">
          {{ new Date(record.created_at).toLocaleString() }}
        </template>
        
        <template v-if="column.key.toString().startsWith('question_')">
          <span v-if="getAnswer(record, column.questionId)">
            {{ formatAnswer(getAnswer(record, column.questionId)!, column.questionConfig) }}
          </span>
          <span v-else style="color: #ccc">未回答</span>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { apiService } from '../../api'
import type { Survey, Submission, Answer, QuestionConfig } from '../../types'
import { QuestionType, parseAnswerValue } from '../../types'

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

const columns = computed(() => {
  const baseColumns = [
    {
      title: '姓名',
      dataIndex: ['user', 'name'],
      key: 'name',
      fixed: 'left' as const,
      resizable: true,
      width: 70
    },
    {
      title: '学号',
      dataIndex: ['user', 'id_number'],
      key: 'id_number',
      width: 120
    },
    {
      title: '提交时间',
      key: 'submitted_at',
      width: 160
    }
  ]
  
  // 为每个问题添加列
  const questionColumns = (survey.value?.questions || []).map((question, index) => ({
    title: question.description || `问题${index + 1}`,
    key: `question_${question.id}`,
    questionId: question.id,
    questionConfig: question.config,
  }))
  
  return [...baseColumns, ...questionColumns]
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

function getAnswer(submission: Submission, questionId: number): Answer | undefined {
  return submission.answers?.find(answer => answer.question_id === questionId)
}

function formatAnswer(answer: Answer, config: QuestionConfig): string {
  const value = parseAnswerValue(answer, config)
  
  if (config.type === QuestionType.STAR) {
    const stars = '★'.repeat(value as number) + '☆'.repeat((config.maxStars || 5) - (value as number))
    return `${stars} (${value})`
  }
  
  return String(value)
}

onMounted(() => {
  loadData()
})
</script>
