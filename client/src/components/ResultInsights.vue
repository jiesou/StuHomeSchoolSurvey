<template>
  <div v-if="survey">
    <a-card title="统计分析" style="margin-bottom: 24px">
      <a-tabs v-model:activeKey="activeQuestionId">
        <a-tab-pane 
          v-for="(question, index) in survey.questions" 
          :key="question.id"
          :tab="question.description || `问题${index + 1}`"
        >
          <div v-if="loadingInsights[question.id]" style="text-align: center; padding: 40px">
            <a-spin tip="加载中..." />
          </div>
          
          <div v-else-if="insights[question.id]">
            <!-- 词云 - INPUT类型 -->
            <div v-if="insights[question.id]!.type === 'wordcloud'" style="padding: 20px">
              <p style="margin-bottom: 16px">
                回答人数: {{ insights[question.id]!.totalResponses }}
              </p>
              <vue-word-cloud
                v-if="(insights[question.id] as WordCloudInsight).words.length > 0"
                style="height: 400px; width: 100%"
                :words="(insights[question.id] as WordCloudInsight).words"
                :color="([, weight]: [string, number]) => weight > 10 ? 'DeepPink' : weight > 5 ? 'RoyalBlue' : 'Indigo'"
                font-family="Arial, sans-serif"
              />
              <a-empty v-else description="暂无数据" />
            </div>
            
            <!-- 星级分布 - STAR类型 -->
            <div v-if="insights[question.id]!.type === 'star_distribution'" style="padding: 20px">
              <a-row :gutter="16">
                <a-col :span="12">
                  <a-statistic 
                    title="平均评分" 
                    :value="(insights[question.id] as StarDistributionInsight).average"
                    :precision="2"
                    suffix="星"
                  />
                </a-col>
                <a-col :span="12">
                  <a-statistic 
                    title="回答人数" 
                    :value="(insights[question.id] as StarDistributionInsight).totalResponses"
                  />
                </a-col>
              </a-row>
              
              <div style="margin-top: 24px">
                <div 
                  v-for="star in getStarRange((insights[question.id] as StarDistributionInsight))" 
                  :key="star"
                  style="margin-bottom: 12px"
                >
                  <div style="display: flex; align-items: center">
                    <span style="width: 80px">{{ star }}星:</span>
                    <a-progress 
                      :percent="getStarPercent((insights[question.id] as StarDistributionInsight), star)"
                      :format="(percent: number) => `${(insights[question.id] as StarDistributionInsight).distribution[star] || 0}人 (${percent}%)`"
                      :stroke-color="getStarColor(star)"
                      style="flex: 1"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <a-empty v-else description="加载失败" />
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
// @ts-ignore - vuewordcloud doesn't have type definitions
import VueWordCloud from 'vuewordcloud'
import { apiService } from '../api'
import type { Survey, QuestionInsight, WordCloudInsight, StarDistributionInsight } from '../types'

interface Props {
  survey: Survey | null
}

const props = defineProps<Props>()

const activeQuestionId = ref<number>()
const insights = ref<Record<number, QuestionInsight>>({})
const loadingInsights = ref<Record<number, boolean>>({})

// 加载问题的统计数据
async function loadInsight(questionId: number) {
  if (insights.value[questionId] || loadingInsights.value[questionId]) {
    return // 已加载或正在加载
  }
  
  loadingInsights.value[questionId] = true
  
  try {
    const insight = await apiService.getQuestionInsight(
      props.survey!.id,
      questionId
    )
    insights.value[questionId] = insight
  } catch (error) {
    console.error('加载统计数据失败:', error)
  } finally {
    loadingInsights.value[questionId] = false
  }
}

// 监听活动标签页变化
watch(activeQuestionId, (questionId) => {
  if (questionId) {
    loadInsight(questionId)
  }
})

// 初始化时加载第一个问题的数据
onMounted(() => {
  if (props.survey?.questions && props.survey.questions.length > 0) {
    activeQuestionId.value = props.survey.questions[0]!.id
    loadInsight(props.survey.questions[0]!.id)
  }
})

// 获取星级范围
function getStarRange(insight: StarDistributionInsight): number[] {
  const maxStar = Math.max(...Object.keys(insight.distribution).map(Number))
  return Array.from({ length: maxStar + 1 }, (_, i) => i)
}

// 计算星级百分比
function getStarPercent(insight: StarDistributionInsight, star: number): number {
  if (insight.totalResponses === 0) return 0
  const count = insight.distribution[star] || 0
  return Math.round((count / insight.totalResponses) * 100)
}

// 获取星级颜色
function getStarColor(star: number): string {
  const colors = ['#d9d9d9', '#ff4d4f', '#ff7a45', '#ffa940', '#52c41a', '#1890ff']
  return colors[star] || '#1890ff'
}
</script>
