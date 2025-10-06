<template>
  <div>
    <div style="margin-bottom: 8px; text-align: center; opacity: 0.65">
      {{ currentSurveyInfo }}
    </div>
    <vue-word-cloud
      v-if="currentWords.length > 0"
      style="height: 400px; width: 100%"
      :words="currentWords"
      font-family="sans-serif"
    />
    <a-empty v-else description="暂无数据" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
// @ts-ignore
import VueWordCloud from 'vuewordcloud'
import type { CrossInsightUser } from '../types'

interface Props {
  users: CrossInsightUser[]
}

const props = defineProps<Props>()

const currentIndex = ref(0)
let intervalId: number | null = null

// 当前展示的问卷信息
const currentSurveyInfo = computed(() => {
  if (props.users.length === 0 || props.users[0].histories.length === 0) {
    return ''
  }
  const history = props.users[0].histories[currentIndex.value]
  if (!history) return ''
  return `${history.survey_title} (${history.survey_year} ${history.survey_semester === 1 ? '上' : '下'}学期 第${history.survey_week}周)`
})

// 当前展示的词云数据
const currentWords = computed(() => {
  // 收集当前问卷索引下所有用户的答案
  const answers: string[] = []
  
  props.users.forEach(user => {
    const history = user.histories[currentIndex.value]
    if (history?.answer_value) {
      answers.push(history.answer_value)
    }
  })

  if (answers.length === 0) return []

  // 简单的词频统计（按空格分词）
  const wordCount = new Map<string, number>()
  answers.forEach(answer => {
    const words = answer.split(/\s+/).filter(w => w.length > 0)
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1)
    })
  })

  // 转换为词云格式
  const words = Array.from(wordCount.entries())
    .map(([text, weight]) => ({ text, weight }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 50)

  // 添加颜色
  if (words.length > 0) {
    const weights = words.map(w => w.weight)
    const minWeight = Math.min(...weights)
    const maxWeight = Math.max(...weights)

    if (maxWeight === minWeight) {
      words.forEach(word => (word as any).color = 'RoyalBlue')
    } else {
      const range = maxWeight - minWeight
      words.forEach(word => {
        const normalized = (word.weight - minWeight) / range
        if (normalized >= 0.7) {
          (word as any).color = 'DeepPink'
        } else if (normalized >= 0.3) {
          (word as any).color = 'RoyalBlue'
        } else {
          (word as any).color = 'Indigo'
        }
      })
    }
  }

  return words
})

onMounted(() => {
  // 每秒切换到下一个问卷
  if (props.users.length > 0 && props.users[0].histories.length > 1) {
    intervalId = window.setInterval(() => {
      currentIndex.value = (currentIndex.value + 1) % props.users[0].histories.length
    }, 1000)
  }
})

onBeforeUnmount(() => {
  if (intervalId !== null) {
    clearInterval(intervalId)
  }
})
</script>
