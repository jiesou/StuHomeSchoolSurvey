<template>
  <div>
    <a-page-header 
      title="跨问卷聚合分析"
      @back="$router.push('/admin')"
    />

    <a-descriptions v-if="baseSurvey" bordered size="small" style="margin-bottom: 24px">
      <a-descriptions-item label="基准问卷">{{ baseSurvey.title }}</a-descriptions-item>
      <a-descriptions-item label="学年">{{ baseSurvey.year }}</a-descriptions-item>
      <a-descriptions-item label="学期">{{ baseSurvey.semester === 1 ? '第一学期' : '第二学期' }}</a-descriptions-item>
      <a-descriptions-item label="周次">第{{ baseSurvey.week }}周</a-descriptions-item>
      <a-descriptions-item label="问题数量">{{ questions.length }}</a-descriptions-item>
      <a-descriptions-item label="分析问卷数">{{ surveyIds.length }}</a-descriptions-item>
    </a-descriptions>

    <a-collapse v-model:activeKey="activeKeys" accordion>
      <a-collapse-panel 
        v-for="(question, index) in questions" 
        :key="index"
        :header="question.description || `问题 ${index + 1}`"
      >
        <div v-if="activeKeys.includes(index)" style="min-height: 400px">
          <a-spin v-if="loadingInsights[index]" :spinning="true" style="margin-top: 100px">
            <div style="text-align: center">正在加载洞察...</div>
          </a-spin>
          <div v-else-if="insights[index]">
            <!-- Star 类型：折线图 -->
            <div v-if="insights[index].question.config.type === 'star'">
              <Line :data="getChartData(insights[index])" :options="chartOptions" />
            </div>
            <!-- Input 类型：动画词云 -->
            <div v-else-if="insights[index].question.config.type === 'input'">
              <AnimatedWordCloud :insight="insights[index]" />
            </div>
          </div>
        </div>
      </a-collapse-panel>
    </a-collapse>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
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
import type { Survey, CrossInsightResponse, QuestionType } from '../../types'
import AnimatedWordCloud from '../../components/AnimatedWordCloud.vue'

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
const surveyIds = ref<number[]>([])
const baseSurvey = ref<Survey | null>(null)
const questions = ref<any[]>([])
const activeKeys = ref<number[]>([])
const insights = ref<{ [key: number]: CrossInsightResponse }>({})
const loadingInsights = ref<{ [key: number]: boolean }>({})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top' as const
    },
    title: {
      display: true,
      text: '用户评分变化趋势'
    }
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

async function loadBaseSurvey() {
  try {
    const surveysParam = route.query.surveys as string
    if (!surveysParam) {
      message.error('缺少问卷参数')
      return
    }
    
    surveyIds.value = surveysParam.split(',').map(id => parseInt(id))
    if (surveyIds.value.length < 2) {
      message.error('至少需要选择 2 个问卷')
      return
    }

    // 加载第一个问卷作为基准
    const firstSurveyId = surveyIds.value[0]
    if (!firstSurveyId) {
      message.error('无效的问卷ID')
      return
    }
    baseSurvey.value = await apiService.getSurvey(firstSurveyId)
    questions.value = baseSurvey.value.questions || []
  } catch (error) {
    message.error('加载问卷失败：' + (error as Error).message)
  }
}

async function loadInsight(questionIndex: number) {
  const question = questions.value[questionIndex]
  if (!question || !question.id || loadingInsights.value[questionIndex] || insights.value[questionIndex]) {
    return
  }

  loadingInsights.value[questionIndex] = true
  try {
    const insight = await apiService.getCrossInsight(question.id, surveyIds.value)
    insights.value[questionIndex] = insight
  } catch (error) {
    message.error('加载洞察失败：' + (error as Error).message)
  } finally {
    loadingInsights.value[questionIndex] = false
  }
}

function getChartData(insight: CrossInsightResponse) {
  // 为每个用户生成不同颜色
  const colors = [
    'rgb(255, 99, 132)',
    'rgb(54, 162, 235)',
    'rgb(255, 206, 86)',
    'rgb(75, 192, 192)',
    'rgb(153, 102, 255)',
    'rgb(255, 159, 64)',
    'rgb(199, 199, 199)',
    'rgb(83, 102, 255)',
    'rgb(255, 99, 255)',
    'rgb(99, 255, 132)'
  ]

  const datasets = insight.users.map((userData, index) => {
    const data = userData.histories.map(h => parseFloat(h.answer_value))
    return {
      label: userData.user.name,
      data,
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length],
      tension: 0.1
    }
  })

  // 使用第一个用户的历史记录作为标签
  const labels = insight.surveys.map(s => {
    return `${s.year} ${s.semester === 1 ? '上' : '下'} 第${s.week}周`
  })

  return {
    labels,
    datasets
  }
}

watch(activeKeys, (newKeys) => {
  if (newKeys.length > 0 && typeof newKeys[0] === 'number') {
    loadInsight(newKeys[0])
  }
})

onMounted(() => {
  loadBaseSurvey()
})
</script>

<style scoped>
.chart-container {
  height: 400px;
}
</style>
