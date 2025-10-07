<template>
  <div>
    <a-page-header 
      title="跨问卷聚合分析" 
      @back="() => router.back()"
    >
      <template #subTitle>
        已选择 {{ surveyIds.length }} 个问卷
      </template>
    </a-page-header>

    <a-spin :spinning="loadingSurveys">
      <a-space direction="vertical" :size="24" style="width: 100%; padding: 24px;">
        <a-card 
          v-for="(question, index) in questions" 
          :key="question.id"
          :ref="el => setCardRef(el, question.id)"
          :title="`${index + 1}. ${question.description}`"
          :loading="loadingInsights[question.id]"
        >
          <template v-if="insights[question.id]">
            <!-- 星级问题：折线图 -->
            <template v-if="question.config.type === QuestionType.STAR">
              <Line 
                :data="getChartData(question.id)" 
                :options="chartOptions"
                style="max-height: 400px;"
              />
            </template>

            <!-- 文本问题：动画词云 -->
            <template v-else-if="question.config.type === QuestionType.INPUT">
              <AnimationWordcloud :wordsByWeek="getWordsByWeek(question.id)" />
            </template>
          </template>
          <a-empty v-else />
        </a-card>
      </a-space>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
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
import AnimationWordcloud from '../../components/AnimationWordcloud.vue'
import type { Survey, Question, CrossInsightResponse } from '../../types'
import { QuestionType } from '../../types'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const router = useRouter()
const route = useRoute()

const surveyIds = ref<number[]>([])
const loadingSurveys = ref(false)
const surveys = ref<Survey[]>([])
const questions = ref<Question[]>([])
const insights = ref<Record<number, CrossInsightResponse>>({})
const loadingInsights = ref<Record<number, boolean>>({})
const cardRefs = new Map<number, Element>()
let observer: IntersectionObserver | null = null

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
  },
  scales: {
    y: {
      min: 0,
      max: 5,
      ticks: {
        stepSize: 1
      }
    }
  }
}

function setCardRef(el: any, questionId: number) {
  const targetEl = el?.$el || el
  if (targetEl) {
    cardRefs.set(questionId, targetEl)
    targetEl.setAttribute('data-question-id', String(questionId))
    observer?.observe(targetEl)
  } else {
    const oldEl = cardRefs.get(questionId)
    if (oldEl) {
      observer?.unobserve(oldEl)
      cardRefs.delete(questionId)
    }
  }
}

async function loadSurveys() {
  loadingSurveys.value = true
  try {
    // 获取所有选中的问卷
    const surveyPromises = surveyIds.value.map(id => apiService.getSurvey(id))
    surveys.value = await Promise.all(surveyPromises)

    // 使用第一个问卷的问题列表作为基准
    if (surveys.value.length > 0) {
      const firstSurvey = surveys.value[0]
      if (firstSurvey && firstSurvey.questions) {
        questions.value = firstSurvey.questions
      }
    }
  } catch (error) {
    message.error('加载问卷失败：' + (error as Error).message)
  } finally {
    loadingSurveys.value = false
  }
}

async function loadInsight(questionId: number) {
  if (insights.value[questionId] || loadingInsights.value[questionId]) {
    return
  }

  loadingInsights.value[questionId] = true
  try {
    const insight = await apiService.getCrossInsight(questionId, surveyIds.value)
    insights.value[questionId] = insight
  } catch (error) {
    console.error(`加载问题 ${questionId} 的跨问卷分析失败:`, error)
    message.error('加载分析失败：' + (error as Error).message)
  } finally {
    loadingInsights.value[questionId] = false
  }
}

function getChartData(questionId: number) {
  const insight = insights.value[questionId]
  if (!insight || insight.questionType !== QuestionType.STAR) {
    return { labels: [], datasets: [] }
  }

  // 获取所有周次（横轴）
  const weeks = new Set<number>()
  insight.users.forEach(user => {
    user.surveys.forEach(survey => weeks.add(survey.week))
  })
  const sortedWeeks = Array.from(weeks).sort((a, b) => a - b)

  // 为每个用户创建一条线
  const datasets = insight.users.map((user, index) => {
    const colors = [
      'rgb(255, 99, 132)',
      'rgb(54, 162, 235)',
      'rgb(255, 205, 86)',
      'rgb(75, 192, 192)',
      'rgb(153, 102, 255)',
      'rgb(255, 159, 64)',
      'rgb(201, 203, 207)',
      'rgb(255, 99, 71)',
      'rgb(60, 179, 113)',
      'rgb(106, 90, 205)'
    ]
    const color = colors[index % colors.length]

    // 为每个周次找到对应的答案值
    const data = sortedWeeks.map(week => {
      const survey = user.surveys.find(s => s.week === week)
      return survey ? parseInt(survey.answer_value) : null
    })

    return {
      label: user.name,
      data,
      borderColor: color,
      backgroundColor: color,
      tension: 0.3
    }
  })

  return {
    labels: sortedWeeks.map(w => `第${w}周`),
    datasets
  }
}

function getWordsByWeek(questionId: number) {
  const insight = insights.value[questionId]
  if (!insight || insight.questionType !== QuestionType.INPUT) {
    return []
  }

  // 按周次分组文本
  const textByWeek = new Map<number, string[]>()
  
  insight.users.forEach(user => {
    user.surveys.forEach(survey => {
      if (!textByWeek.has(survey.week)) {
        textByWeek.set(survey.week, [])
      }
      const weekTexts = textByWeek.get(survey.week)
      if (weekTexts) {
        weekTexts.push(survey.answer_value)
      }
    })
  })

  // 为每个周次生成词云（简单分词）
  const result: Array<{ week: number; words: Array<[string, number]> }> = []
  
  textByWeek.forEach((texts, week) => {
    const allText = texts.join(' ')
    
    // 简单分词：按中文字符和标点分割
    const words = allText.match(/[\u4e00-\u9fa5]+/g) || []
    
    // 统计词频
    const wordCount = new Map<string, number>()
    for (const word of words) {
      // 过滤单字
      if (word.length > 1) {
        wordCount.set(word, (wordCount.get(word) || 0) + 1)
      }
    }
    
    // 转换为数组并按频率排序，取前50个
    const sortedWords = Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50) as [string, number][]
    
    result.push({ week, words: sortedWords })
  })

  // 按周次排序
  result.sort((a, b) => a.week - b.week)
  
  return result
}

onMounted(() => {
  // 解析 URL 参数
  const surveysParam = route.query.surveys as string
  if (!surveysParam) {
    message.error('缺少问卷参数')
    router.back()
    return
  }

  surveyIds.value = surveysParam.split(',').map(id => parseInt(id)).filter(id => !isNaN(id))
  
  if (surveyIds.value.length < 2) {
    message.error('至少需要选择2个问卷')
    router.back()
    return
  }

  loadSurveys()

  // 设置懒加载观察器
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const questionId = parseInt(entry.target.getAttribute('data-question-id') || '0')
          if (questionId) {
            loadInsight(questionId)
            observer?.unobserve(entry.target)
          }
        }
      })
    },
    { rootMargin: '100px' }
  )

  // 观察已渲染的元素
  cardRefs.forEach(el => observer!.observe(el))
})

onBeforeUnmount(() => {
  observer?.disconnect()
  cardRefs.clear()
})
</script>
