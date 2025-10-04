<template>
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
      
      <template v-if="column.key?.toString().startsWith('question_')">
        <span v-if="getAnswer(record as Submission, (column as CustomColumn).questionId!)">
          {{ formatAnswer(getAnswer(record as Submission, (column as CustomColumn).questionId!)!, (column as CustomColumn).questionConfig!) }}
        </span>
        <span v-else style="color: #ccc">未回答</span>
      </template>
    </template>
  </a-table>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { apiService } from '../api'
import type { Survey, Submission, Answer, QuestionConfig } from '../types'
import { QuestionType, parseAnswerValue } from '../types'

interface CustomColumn {
  title?: string;
  dataIndex?: string | string[];
  key?: string;
  fixed?: 'left' | 'right';
  resizable?: boolean;
  width?: number;
  questionId?: number;
  questionConfig?: QuestionConfig;
}

interface Props {
  survey: Survey | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  totalChange: [total: number]
}>()

const loading = ref(false)
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
  const questionColumns = (props.survey?.questions || []).map((question, index) => ({
    title: question.description || `问题${index + 1}`,
    key: `question_${question.id}`,
    questionId: question.id,
    questionConfig: question.config,
  }))
  
  return [...baseColumns, ...questionColumns]
})

async function loadData() {
  if (!props.survey) return
  
  loading.value = true
  try {
    const resultsData = await apiService.getSurveyResults(
      props.survey.id, 
      pagination.value.current, 
      pagination.value.pageSize
    )
    
    submissions.value = resultsData.submissions
    pagination.value.total = resultsData.total
    emit('totalChange', resultsData.total)
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

// 当 survey 变化时加载数据
watch(() => props.survey, (newSurvey) => {
  if (newSurvey) {
    loadData()
  }
}, { immediate: true })

function getAnswer(submission: Submission, questionId: number): Answer | undefined {
  return submission.answers?.find(answer => answer.question_id === questionId)
}

function formatAnswer(answer: Answer, config: QuestionConfig): string {
  const value = parseAnswerValue(answer, config)
  
  if (config.type === QuestionType.STAR) {
    const stars = '★'.repeat(value as number) + '☆'.repeat((config.maxStars || 5) - (value as number))
    return `${stars}`
  }
  
  return String(value)
}
</script>
