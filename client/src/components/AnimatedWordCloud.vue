<template>
  <div>
    <div style="text-align: center; margin-bottom: 16px">
      <a-tag color="blue">
        {{ currentSurveyInfo }}
      </a-tag>
    </div>
    <div style="height: 400px">
      <VueWordCloud
        :words="currentWords"
        :color="() => `hsl(${Math.random() * 360}, 70%, 50%)`"
        font-family="Arial, sans-serif"
        :spacing="0.5"
        :font-size-ratio="5"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import VueWordCloud from 'vuewordcloud'
import type { CrossInsightResponse } from '../types'

interface Props {
  insight: CrossInsightResponse
}

const props = defineProps<Props>()

const currentIndex = ref(0)
let intervalId: number | null = null

// 当前显示的问卷信息
const currentSurveyInfo = computed(() => {
  if (props.insight.surveys.length === 0) return ''
  const survey = props.insight.surveys[currentIndex.value]
  return `${survey.year} 第${survey.semester === 1 ? '一' : '二'}学期 第${survey.week}周`
})

// 当前显示的词云数据
const currentWords = computed(() => {
  const words: [string, number][] = []
  const wordFreq = new Map<string, number>()

  // 获取当前问卷索引对应的所有用户的回答
  props.insight.users.forEach(userData => {
    if (userData.histories[currentIndex.value]) {
      const answer = userData.histories[currentIndex.value].answer_value
      if (answer && answer.trim()) {
        // 简单分词：按空格、标点分割
        const terms = answer.split(/[\s，。！？、；：""''（）【】\[\],.!?;:()\-]+/)
          .filter(t => t.length > 0)
        
        terms.forEach(term => {
          const count = wordFreq.get(term) || 0
          wordFreq.set(term, count + 1)
        })
      }
    }
  })

  // 转换为词云格式
  wordFreq.forEach((count, word) => {
    words.push([word, count])
  })

  // 如果没有词，返回占位符
  if (words.length === 0) {
    return [['暂无数据', 1]]
  }

  return words
})

onMounted(() => {
  // 每秒切换到下一个问卷
  intervalId = window.setInterval(() => {
    currentIndex.value = (currentIndex.value + 1) % props.insight.surveys.length
  }, 1000)
})

onUnmounted(() => {
  if (intervalId !== null) {
    clearInterval(intervalId)
  }
})
</script>

<style scoped>
/* Add any custom styles here */
</style>
