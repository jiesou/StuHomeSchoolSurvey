<template>
  <div>
    <a-page-header 
      title="跨问卷聚合分析"
      @back="$router.push('/admin')"
    />

    <a-spin v-if="loading" size="large" style="display: block; text-align: center; margin: 40px 0" />

    <a-space v-else direction="vertical" :size="24" style="width: 100%">
      <a-card 
        v-for="(question, index) in questions" 
        :key="index"
        :ref="el => setCardRef(el, index)"
        :title="`问题 ${index + 1}: ${question.description}`"
        :loading="loadingInsights[index]"
      >
        <a-empty v-if="!insights[index]" />
        
        <!-- 星级类型：折线图 -->
        <template v-if="insights[index]?.question_type === QuestionType.STAR">
          <Line :data="getChartData(index)" :options="chartOptions" />
        </template>
        
        <!-- 文本类型：动画词云 -->
        <template v-if="insights[index]?.question_type === QuestionType.INPUT">
          <AnimatedWordcloud :users="insights[index]!.users" />
        </template>
      </a-card>
    </a-space>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { apiService } from '../../api'
import type { CrossInsightResponse, Survey } from '../../types'
import { QuestionType } from '../../types'
import AnimatedWordcloud from '../../components/AnimatedWordcloud.vue'

// 注册 Chart.js 组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const route = useRoute()
const loading = ref(true)
const questions = ref<{ description: string | null }[]>([])
const insights = ref<Record<number, CrossInsightResponse>>({})
const loadingInsights = ref<Record<number, boolean>>({})
const cardRefs = new Map<number, Element>()
let observer: IntersectionObserver | null = null

const surveyIds = ref<number[]>([])

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top' as const
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 5,
      title: {
        display: true,
        text: '评分'
      }
    }
  }
}

function setCardRef(el: any, questionIndex: number) {
  const targetEl = el?.$el || el
  if (targetEl) {
    cardRefs.set(questionIndex, targetEl)
    targetEl.setAttribute('data-question-index', String(questionIndex))
    observer?.observe(targetEl)
  } else {
    const oldEl = cardRefs.get(questionIndex)
    if (oldEl) {
      observer?.unobserve(oldEl)
      cardRefs.delete(questionIndex)
    }
  }
}

async function loadInsight(questionIndex: number) {
  if (insights.value[questionIndex] || loadingInsights.value[questionIndex]) {
    return
  }

  const question = questions.value[questionIndex]
  if (!question) return

  loadingInsights.value[questionIndex] = true
  try {
    // 使用第一个问卷的问题ID作为参考
    const firstSurveyId = surveyIds.value[0]
    if (!firstSurveyId) {
      throw new Error('问卷ID无效')
    }
    const firstSurvey = await apiService.getSurvey(firstSurveyId)
    const matchingQuestion = firstSurvey.questions?.find(
      q => q.description === question.description
    )

    if (!matchingQuestion) {
      throw new Error('未找到匹配的问题')
    }

    const insight = await apiService.getCrossInsight(matchingQuestion.id, surveyIds.value)
    insights.value[questionIndex] = insight
  } catch (error) {
    console.error(`加载问题 ${questionIndex} 的聚合分析失败:`, error)
    message.error(`加载失败: ${(error as Error).message}`)
  } finally {
    loadingInsights.value[questionIndex] = false
  }
}

function getChartData(questionIndex: number) {
  const insight = insights.value[questionIndex]
  if (!insight) {
    return { labels: [], datasets: [] }
  }

  // 生成颜色数组
  const colors = [
    'rgb(255, 99, 132)',
    'rgb(54, 162, 235)',
    'rgb(255, 206, 86)',
    'rgb(75, 192, 192)',
    'rgb(153, 102, 255)',
    'rgb(255, 159, 64)',
    'rgb(201, 203, 207)',
    'rgb(255, 99, 71)',
    'rgb(60, 179, 113)',
    'rgb(238, 130, 238)'
  ]

  // X轴标签：问卷创建时间
  const labels = insight.users[0]?.histories.map(h => 
    new Date(h.survey_created_at).toLocaleDateString()
  ) || []

  // 每个用户一条线
  const datasets = insight.users.map((user, idx) => ({
    label: user.user_name,
    data: user.histories.map(h => h.answer_value ? parseFloat(h.answer_value) : null) as (number | null)[],
    borderColor: colors[idx % colors.length],
    backgroundColor: colors[idx % colors.length],
    tension: 0.3
  }))

  return { labels, datasets }
}

async function loadQuestions() {
  loading.value = true
  try {
    const surveysParam = route.query.surveys as string
    if (!surveysParam) {
      throw new Error('缺少问卷ID参数')
    }

    surveyIds.value = surveysParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))

    if (surveyIds.value.length < 2) {
      throw new Error('至少需要选择2个问卷')
    }

    // 加载所有问卷，找出共同的问题
    const surveys = await Promise.all(
      surveyIds.value.map(id => apiService.getSurvey(id))
    )

    // 找出所有问卷都有的问题（通过description匹配）
    const firstSurvey = surveys[0]
    if (!firstSurvey) {
      throw new Error('无法加载问卷')
    }
    const commonQuestions: { description: string | null }[] = []

    firstSurvey.questions?.forEach(q1 => {
      const existsInAll = surveys.every(survey => 
        survey.questions?.some(q2 => q2.description === q1.description)
      )
      if (existsInAll) {
        commonQuestions.push({ description: q1.description || null })
      }
    })

    if (commonQuestions.length === 0) {
      message.warning('所选问卷没有共同的问题')
    }

    questions.value = commonQuestions
  } catch (error) {
    message.error('加载问题列表失败：' + (error as Error).message)
    console.error('加载问题列表失败：', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadQuestions()

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const questionIndex = parseInt(entry.target.getAttribute('data-question-index') || '-1')
          if (questionIndex >= 0) {
            loadInsight(questionIndex)
            observer?.unobserve(entry.target)
          }
        }
      })
    },
    { rootMargin: '100px' }
  )

  // Observe elements that were rendered before this hook
  cardRefs.forEach(el => observer!.observe(el))
})

onBeforeUnmount(() => {
  observer?.disconnect()
  cardRefs.clear()
})
</script>

<style scoped>
.chart-container {
  height: 400px;
}
</style>
