<template>
  <a-space direction="vertical" :size="24" style="width: 100%">
    <a-card 
      v-for="(question, index) in survey?.questions" 
      :key="question.id"
      :ref="el => setCardRef(el, question.id)"
      :title="`${index + 1}. ${question.description}`"
      :loading="loadingInsights[question.id]"
    >
      <a-empty v-if="!insights[question.id]" />
      <!-- 星级分布 -->
      <template v-if="question.config.type === QuestionType.STAR && (insights[question.id] as any)?.type === 'star'">
        <div style="margin-bottom: 16px">
          <a-statistic 
            title="平均评分" 
            :value="(insights[question.id] as StarDistributionInsight).average.toFixed(2)" 
            suffix="星"
          />
          <div style="margin-top: 8px; opacity: 0.65">
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
      </template>
      
      <!-- 词云 -->
      <template v-if="question.config.type === QuestionType.INPUT && (insights[question.id] as any)?.type === 'wordcloud'">
        <a-empty v-if="(insights[question.id] as WordCloudInsight).words.length === 0" />
        <vue-word-cloud
          v-else
          style="height: 400px; width: 100%"
          :words="(insights[question.id] as WordCloudInsight).words"
          font-family="sans-serif"
        />
      </template>
    </a-card>
  </a-space>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
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
const cardRefs = new Map<number, Element>()
let observer: IntersectionObserver | null = null

function setCardRef(el: any, questionId: number) {
  const targetEl = el?.$el || el
  if (targetEl) {
    cardRefs.set(questionId, targetEl)
    targetEl.setAttribute('data-question-id', String(questionId))
    // If observer is ready, observe immediately.
    // Otherwise, onMounted will handle it.
    observer?.observe(targetEl)
  } else {
    const oldEl = cardRefs.get(questionId)
    if (oldEl) {
      observer?.unobserve(oldEl)
      cardRefs.delete(questionId)
    }
  }
}

async function loadInsight(questionId: number) {
  if (insights.value[questionId] || loadingInsights.value[questionId]) {
    return
  }
  
  if (!props.survey) return
  
  loadingInsights.value[questionId] = true
  try {
    const insight = await apiService.getQuestionInsight(props.survey.id, questionId) as WordCloudInsight | StarDistributionInsight;

    if (insight.type === 'wordcloud' && insight.words.length > 0) {
      const words = insight.words;
      const weights = words.map(w => w.weight);
      const minWeight = Math.min(...weights);
      const maxWeight = Math.max(...weights);

      if (maxWeight === minWeight) {
        words.forEach(word => word.color = 'RoyalBlue');
      } else {
        const range = maxWeight - minWeight;
        words.forEach(word => {
          const normalized = (word.weight - minWeight) / range;
          if (normalized >= 0.7) {
            word.color = 'DeepPink';
          } else if (normalized >= 0.3) {
            word.color = 'RoyalBlue';
          } else {
            word.color = 'Indigo';
          }
        });
      }
    }

    insights.value[questionId] = insight
  } catch (error) {
    console.error(`加载问题 ${questionId} 的统计失败:`, error)
  } finally {
    loadingInsights.value[questionId] = false
  }
}

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const questionId = parseInt(entry.target.getAttribute('data-question-id') || '0')
          if (questionId) {
            loadInsight(questionId)
            // Stop observing after first intersection
            observer?.unobserve(entry.target)
          }
        }
      })
    },
    { rootMargin: '100px' } // 提前加载
  )

  // Observe elements that were rendered before this hook
  cardRefs.forEach(el => observer!.observe(el))
})

onBeforeUnmount(() => {
  // Disconnect observer and clear refs
  observer?.disconnect()
  cardRefs.clear()
})

function getStarRange(maxStars: number): number[] {
  return Array.from({ length: maxStars + 1 }, (_, i) => maxStars - i)
}

function getStarPercentage(questionId: number, star: number): number {
  const insight = insights.value[questionId] as StarDistributionInsight | undefined
  if (!insight || insight.type !== 'star' || insight.total === 0) return 0
  
  const count = insight.distribution[star] || 0
  return Math.round((count / insight.total) * 100)
}
</script>
