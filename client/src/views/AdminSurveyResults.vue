<template>
  <div>
    <a-card v-if="survey" :title="`问卷结果: ${survey.title}`">
      <template #extra>
        <a-space>
          <a-statistic 
            title="总提交数" 
            :value="totalSubmissions" 
            style="margin-right: 16px"
          />
          <router-link to="/admin/surveys">
            <a-button>返回列表</a-button>
          </router-link>
        </a-space>
      </template>

      <a-descriptions :column="2" bordered style="margin-bottom: 24px">
        <a-descriptions-item label="问卷描述">
          {{ survey.description || '无' }}
        </a-descriptions-item>
        <a-descriptions-item label="学期">
          {{ survey.year }}年第{{ survey.semester }}学期第{{ survey.week }}周
        </a-descriptions-item>
        <a-descriptions-item label="创建时间">
          {{ new Date(survey.createdAt).toLocaleString('zh-CN') }}
        </a-descriptions-item>
        <a-descriptions-item label="问题数量">
          {{ survey.questions?.length || 0 }}
        </a-descriptions-item>
      </a-descriptions>

      <a-tabs>
        <a-tab-pane key="responses" tab="回答详情">
          <a-table 
            :columns="responseColumns" 
            :data-source="submissions" 
            :pagination="pagination"
            :loading="loading"
            @change="handleTableChange"
            :scroll="{ x: 800 }"
            row-key="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'answers'">
                <div>
                  <div 
                    v-for="answer in record.answers" 
                    :key="answer.id" 
                    style="margin-bottom: 8px"
                  >
                    <strong>{{ getQuestionDescription(answer.questionId) }}:</strong>
                    <br>
                    <template v-if="isStarAnswer(answer.questionId)">
                      <a-rate :value="parseFloat(answer.value)" disabled />
                      ({{ answer.value }}/5)
                    </template>
                    <template v-else>
                      {{ answer.value }}
                    </template>
                  </div>
                </div>
              </template>
            </template>
          </a-table>
        </a-tab-pane>

        <a-tab-pane key="statistics" tab="统计分析" v-if="survey.questions">
          <a-row :gutter="[16, 16]">
            <a-col :span="24" v-for="question in survey.questions" :key="question.id">
              <a-card :title="question.description" size="small">
                <!-- Star Rating Statistics -->
                <template v-if="question.config.type === 'star'">
                  <div style="display: flex; align-items: center; gap: 24px">
                    <a-statistic 
                      title="平均评分" 
                      :value="getAverageRating(question.id)" 
                      :precision="1"
                      suffix="/ 5"
                    />
                    <a-statistic 
                      title="回答数量" 
                      :value="getResponseCount(question.id)"
                    />
                  </div>
                  <div style="margin-top: 16px">
                    <div v-for="rating in [5,4,3,2,1,0]" :key="rating" style="display: flex; align-items: center; margin-bottom: 4px">
                      <span style="width: 60px">{{ rating }}星:</span>
                      <a-progress 
                        :percent="getRatingPercentage(question.id, rating)" 
                        :show-info="true"
                        size="small"
                      />
                      <span style="margin-left: 8px; min-width: 40px">
                        {{ getRatingCount(question.id, rating) }}人
                      </span>
                    </div>
                  </div>
                </template>

                <!-- Text Input Statistics -->
                <template v-if="question.config.type === 'input'">
                  <a-statistic 
                    title="回答数量" 
                    :value="getResponseCount(question.id)"
                    style="margin-bottom: 16px"
                  />
                  <div style="max-height: 300px; overflow-y: auto">
                    <div 
                      v-for="answer in getTextAnswers(question.id)" 
                      :key="answer.id"
                      style="padding: 8px; background: #f5f5f5; margin-bottom: 8px; border-radius: 4px"
                    >
                      <div style="font-size: 12px; color: #666; margin-bottom: 4px">
                        {{ answer.userName }} ({{ answer.userIdNumber }})
                      </div>
                      <div>{{ answer.value }}</div>
                    </div>
                  </div>
                </template>
              </a-card>
            </a-col>
          </a-row>
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { ApiService } from '../services/api'
import type { Survey, Submission, PaginatedResponse, Answer } from '../types'

interface Props {
  id: string
}

const props = defineProps<Props>()

const survey = ref<Survey | null>(null)
const submissions = ref<Submission[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const totalSubmissions = ref(0)

const responseColumns = [
  {
    title: '姓名',
    dataIndex: ['user', 'name'],
    key: 'name',
    width: 100,
  },
  {
    title: '学号',
    dataIndex: ['user', 'idNumber'],
    key: 'idNumber',
    width: 120,
  },
  {
    title: '提交时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 160,
    customRender: ({ text }: { text: Date }) => new Date(text).toLocaleString('zh-CN'),
  },
  {
    title: '回答内容',
    key: 'answers',
  },
]

const pagination = computed(() => ({
  current: currentPage.value,
  pageSize: pageSize.value,
  total: totalSubmissions.value,
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '50'],
  showTotal: (total: number, range: number[]) => 
    `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
}))

const loadSurvey = async () => {
  try {
    survey.value = await ApiService.getSurvey(props.id)
  } catch (error) {
    message.error('加载问卷信息失败')
    console.error('Error loading survey:', error)
  }
}

const loadSubmissions = async () => {
  loading.value = true
  try {
    const response: PaginatedResponse<Submission> = await ApiService.getSurveyResults(
      props.id,
      currentPage.value,
      pageSize.value
    )
    submissions.value = response.data
    totalSubmissions.value = response.pagination.total
  } catch (error) {
    message.error('加载提交记录失败')
    console.error('Error loading submissions:', error)
  } finally {
    loading.value = false
  }
}

const handleTableChange = (pag: any) => {
  currentPage.value = pag.current
  pageSize.value = pag.pageSize
  loadSubmissions()
}

const getQuestionDescription = (questionId: string) => {
  return survey.value?.questions?.find(q => q.id === questionId)?.description || '未知问题'
}

const isStarAnswer = (questionId: string) => {
  return survey.value?.questions?.find(q => q.id === questionId)?.config.type === 'star'
}

// Statistics helper functions
const getAnswersForQuestion = (questionId: string) => {
  const answers: Array<Answer & { userName: string; userIdNumber: string }> = []
  submissions.value.forEach(submission => {
    const answer = submission.answers?.find(a => a.questionId === questionId)
    if (answer && submission.user) {
      answers.push({
        ...answer,
        userName: submission.user.name,
        userIdNumber: submission.user.idNumber
      })
    }
  })
  return answers
}

const getResponseCount = (questionId: string) => {
  return getAnswersForQuestion(questionId).length
}

const getAverageRating = (questionId: string) => {
  const answers = getAnswersForQuestion(questionId)
  if (answers.length === 0) return 0
  
  const sum = answers.reduce((acc, answer) => acc + parseFloat(answer.value), 0)
  return sum / answers.length
}

const getRatingCount = (questionId: string, rating: number) => {
  const answers = getAnswersForQuestion(questionId)
  return answers.filter(answer => Math.floor(parseFloat(answer.value)) === rating).length
}

const getRatingPercentage = (questionId: string, rating: number) => {
  const total = getResponseCount(questionId)
  if (total === 0) return 0
  return Math.round((getRatingCount(questionId, rating) / total) * 100)
}

const getTextAnswers = (questionId: string) => {
  return getAnswersForQuestion(questionId).filter(answer => answer.value.trim())
}

onMounted(async () => {
  await loadSurvey()
  await loadSubmissions()
})
</script>

<style scoped>
:deep(.ant-statistic-title) {
  font-size: 12px;
}

:deep(.ant-progress-text) {
  font-size: 12px;
}
</style>