<template>
  <div>
    <a-page-header 
      v-if="!surveyId"
      :title="surveyIds.length === 1 ? '统计洞察' : '跨问卷聚合分析'" 
      @back="() => router.back()"
    >
      <template #subTitle>
        <span v-if="surveyIds.length > 1">已选择 {{ surveyIds.length }} 个问卷</span>
      </template>
    </a-page-header>

    <a-spin :spinning="loadingSurveys">
      <a-space direction="vertical" :size="24" style="width: 100%;" :style="{ padding: surveyId ? '0' : '24px' }">
        <a-card 
          v-for="(question, index) in questions" 
          :key="question.id"
          :ref="(el: any) => setCardRef(el, question.id)"
          :title="`${index + 1}. ${question.description}`"
          :loading="loadingInsights[question.id]"
        >
          <template v-if="insightsState[question.id]?.error">
            <a-result
              status="warning"
              :title="insightsState[question.id]!.error"
            />
          </template>
          <template v-else-if="insightsState[question.id]?.response">
            <!-- 星级问题 -->
            <template v-if="question.config.type === QuestionType.STAR">
              <!-- 单问卷：显示分布统计 -->
              <template v-if="surveyIds.length === 1">
                <div style="margin-bottom: 16px">
                  <a-statistic 
                    title="平均评分" 
                    :value="getStarAverage(question.id).toFixed(2)" 
                    suffix="星"
                  />
                  <div style="margin-top: 8px; opacity: 0.65">
                    共 {{ getStarTotal(question.id) }} 条回答
                  </div>
                </div>
                
                <a-space direction="vertical" style="width: 100%">
                  <div 
                    v-for="star in getStarRange(question.config.maxStars || 5)" 
                    :key="star"
                    style="display: flex; align-items: center; gap: 12px"
                  >
                    <div style="min-width: 60px">{{ star }}星</div>
                    <a-progress 
                      :percent="getStarPercentage(question.id, star)"
                      :format="(percent: number | undefined) => `${getStarDistribution(question.id)[star] || 0} (${percent}%)`"
                      style="flex: 1"
                    />
                  </div>
                </a-space>
              </template>
              <!-- 多问卷：显示折线图 -->
              <template v-else>
                <Line 
                  :data="getChartData(question.id)" 
                  :options="{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom' },
                    },
                    scales: {
                      y: { beginAtZero: false }
                    }
                  }"
                  style="min-height: 240px;"
                />
              </template>
            </template>

            <!-- 文本问题：词云 -->
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

interface Props {
  surveyId?: number
}

const props = defineProps<Props>()

const router = useRouter()
const route = useRoute()

const surveyIds = ref<number[]>([])
const loadingSurveys = ref(false)
const surveys = ref<Survey[]>([])
const questions = ref<Question[]>([])
const insightsState = ref<Record<number, { 
  response?: CrossInsightResponse; 
  error?: string;
}>>({})
const loadingInsights = ref<Record<number, boolean>>({})
const cardRefs = new Map<number, Element>()
let observer: IntersectionObserver | null = null

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
  if (insightsState.value[questionId] || loadingInsights.value[questionId]) {
    return
  }

  loadingInsights.value[questionId] = true
  try {
    const insight = await apiService.getCrossInsight(questionId, surveyIds.value)
    insightsState.value[questionId] = { response: insight }
  } catch (error) {
    console.error(`加载问题 ${questionId} 的跨问卷分析失败:`, error)
    insightsState.value[questionId] = { 
      error: '加载分析失败：' + (error as Error).message 
    }
  } finally {
    loadingInsights.value[questionId] = false
  }
}

function getChartData(questionId: number) {
  const state = insightsState.value[questionId]
  if (!state?.response || state.response.questionType !== QuestionType.STAR) {
    return { labels: [], datasets: [] }
  }

  const insight = state.response

  // 获取所有周次（横轴）
  const weeks = new Set<number>()
  insight.users.forEach(user => {
    user.surveys.forEach(survey => weeks.add(survey.week))
  })
  const sortedWeeks = Array.from(weeks).sort((a, b) => a - b)

  // 为每个用户创建一条线
  const datasets = insight.users.map((user, index) => {
    // 为每个周次找到对应的答案值
    const data = sortedWeeks.map(week => {
      const survey = user.surveys.find(s => s.week === week)
      if (!survey) return null
      const answerInsight = survey.answer_insight as any
      return answerInsight.value !== undefined ? answerInsight.value : null
    })

    return {
      label: user.name,
      data,
      tension: 0.3
    }
  })

  return {
    labels: sortedWeeks.map(w => `第${w}周`),
    datasets
  }
}

function getWordsByWeek(questionId: number) {
  const state = insightsState.value[questionId]
  if (!state?.response || state.response.questionType !== QuestionType.INPUT) {
    return []
  }

  const insight = state.response

  // 按周次分组词云数据
  const wordsByWeek = new Map<number, Map<string, number>>()
  
  insight.users.forEach(user => {
    user.surveys.forEach(survey => {
      if (!wordsByWeek.has(survey.week)) {
        wordsByWeek.set(survey.week, new Map<string, number>())
      }
      const weekWords = wordsByWeek.get(survey.week)!
      
      // 获取该答案的词云 insight
      const wordcloudInsight = survey.answer_insight as any
      if (wordcloudInsight.words) {
        wordcloudInsight.words.forEach((word: any) => {
          const currentWeight = weekWords.get(word.text) || 0
          weekWords.set(word.text, currentWeight + word.weight)
        })
      }
    })
  })

  // 为每个周次生成最终词云数据
  const result: Array<{ week: number; words: Array<[string, number]> }> = []
  
  wordsByWeek.forEach((words, week) => {
    // 转换为数组并按频率排序，取前50个
    const sortedWords = Array.from(words.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50) as [string, number][]
    
    result.push({ week, words: sortedWords })
  })

  // 按周次排序
  result.sort((a, b) => a.week - b.week)
  
  return result
}

// 单问卷模式下的星级统计函数
function getStarDistribution(questionId: number): Record<number, number> {
  const state = insightsState.value[questionId]
  if (!state?.response || surveyIds.value.length !== 1) return {}
  
  const distribution: Record<number, number> = {}
  const question = questions.value.find((q: any) => q.id === questionId)
  const maxStars = question?.config?.maxStars || 5
  
  // 初始化分布
  for (let i = 0; i <= maxStars; i++) {
    distribution[i] = 0
  }
  
  // 统计分布
  state.response.users.forEach(user => {
    user.surveys.forEach(survey => {
      const answerInsight = survey.answer_insight as any
      if (answerInsight && answerInsight.value !== undefined) {
        const star = answerInsight.value
        if (distribution[star] !== undefined && star >= 0 && star <= maxStars) {
          distribution[star]++
        }
      }
    })
  })
  
  return distribution
}

function getStarAverage(questionId: number): number {
  const state = insightsState.value[questionId]
  if (!state?.response || surveyIds.value.length !== 1) return 0
  
  let sum = 0
  let count = 0
  
  state.response.users.forEach(user => {
    user.surveys.forEach(survey => {
      const answerInsight = survey.answer_insight as any
      if (answerInsight.value !== undefined) {
        sum += answerInsight.value
        count++
      }
    })
  })
  
  return count > 0 ? sum / count : 0
}

function getStarTotal(questionId: number): number {
  const state = insightsState.value[questionId]
  if (!state?.response || surveyIds.value.length !== 1) return 0
  
  let count = 0
  state.response.users.forEach(user => {
    user.surveys.forEach(survey => {
      const answerInsight = survey.answer_insight as any
      if (answerInsight.value !== undefined) {
        count++
      }
    })
  })
  
  return count
}

function getStarRange(maxStars: number): number[] {
  return Array.from({ length: maxStars + 1 }, (_, i) => maxStars - i)
}

function getStarPercentage(questionId: number, star: number): number {
  const distribution = getStarDistribution(questionId)
  const total = getStarTotal(questionId)
  if (total === 0) return 0
  
  const count = distribution[star] || 0
  return Math.round((count / total) * 100)
}

onMounted(() => {
  // 如果是通过 prop 传入单个 surveyId
  if (props.surveyId) {
    surveyIds.value = [props.surveyId]
  } else {
    // 解析 URL 参数
    const surveysParam = route.query.surveys as string
    if (!surveysParam) {
      message.error('缺少问卷参数')
      router.back()
      return
    }

    surveyIds.value = surveysParam.split(',').map(id => parseInt(id)).filter(id => !isNaN(id))
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
