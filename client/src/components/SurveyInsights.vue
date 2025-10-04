<template>
  <div>
    <a-space direction="vertical" :size="24" style="width: 100%">
      <a-card 
        v-for="question in survey?.questions" 
        :key="question.id"
        :title="question.description || `问题${question.id}`"
        :loading="loadingInsights[question.id]"
      >
        <!-- 星级分布 -->
        <template v-if="question.config.type === QuestionType.STAR">
          <div v-if="insights[question.id]?.type === 'star'">
            <div style="margin-bottom: 16px">
              <a-statistic 
                title="平均评分" 
                :value="(insights[question.id] as StarDistributionInsight).average.toFixed(2)" 
                suffix="星"
              />
              <div style="margin-top: 8px; color: #666">
                共 {{ (insights[question.id] as StarDistributionInsight).total }} 条回答
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
                  :format="(percent: number | undefined) => `${(insights[question.id] as StarDistributionInsight).distribution[star] || 0} (${percent}%)`"
                  style="flex: 1"
                />
              </div>
            </a-space>
          </div>
        </template>
        
        <!-- 词云 -->
        <template v-if="question.config.type === QuestionType.INPUT">
          <div v-if="insights[question.id]?.type === 'wordcloud'">
            <div v-if="(insights[question.id] as WordCloudInsight).words.length === 0">
              <a-empty description="暂无数据" />
            </div>
            <vue-word-cloud
              v-else
              style="height: 400px; width: 100%"
              :words="(insights[question.id] as WordCloudInsight).words"
              :color="([, weight]: [string, number]) => weight > 10 ? 'DeepPink' : weight > 5 ? 'RoyalBlue' : 'Indigo'"
              font-family="sans-serif"
            />
          </div>
        </template>
      </a-card>
    </a-space>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
// @ts-ignore - vuewordcloud doesn't have TypeScript definitions
import VueWordCloud from 'vuewordcloud'
import { apiService } from '../api'
import type { Survey, QuestionInsight, WordCloudInsight, StarDistributionInsight } from '../types'
import { QuestionType } from '../types'

interface Props {
  survey: Survey | null
}

const props = defineProps<Props>()

const insights = ref<Record<number, QuestionInsight>>({})
const loadingInsights = ref<Record<number, boolean>>({})

async function loadInsights() {
  if (!props.survey?.questions) return
  
  for (const question of props.survey.questions) {
    loadingInsights.value[question.id] = true
    try {
      const insight = await apiService.getQuestionInsight(props.survey.id, question.id)
      insights.value[question.id] = insight
    } catch (error) {
      console.error(`加载问题 ${question.id} 的统计失败:`, error)
    } finally {
      loadingInsights.value[question.id] = false
    }
  }
}

function getStarRange(maxStars: number): number[] {
  return Array.from({ length: maxStars + 1 }, (_, i) => maxStars - i)
}

function getStarPercentage(questionId: number, star: number): number {
  const insight = insights.value[questionId] as StarDistributionInsight | undefined
  if (!insight || insight.type !== 'star' || insight.total === 0) return 0
  
  const count = insight.distribution[star] || 0
  return Math.round((count / insight.total) * 100)
}

onMounted(() => {
  loadInsights()
})
</script>
