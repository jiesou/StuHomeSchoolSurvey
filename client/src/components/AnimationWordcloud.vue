<template>
  <div style="position: relative; width: 100%; height: 400px;">
    <vue-word-cloud
      :words="currentWords"
      :color="() => {
        const colors = ['DeepPink', 'RoyalBlue', 'Indigo', 'Purple', 'DarkSlateBlue'];
        return colors[Math.floor(Math.random() * colors.length)];
      }"
      font-family="sans-serif"
      style="height: 100%; width: 100%"
    />
    <div style="position: absolute; top: 10px; right: 10px; background: rgba(255, 255, 255, 0.9); padding: 8px 12px; border-radius: 4px; font-size: 14px;">
      第 {{ currentIndex + 1 }} / {{ wordsByWeek.length }} 周
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
// @ts-ignore - vuewordcloud doesn't have TypeScript definitions
import VueWordCloud from 'vuewordcloud'

interface Props {
  wordsByWeek: Array<{ week: number; words: Array<[string, number]> }>
}

const props = defineProps<Props>()

const currentIndex = ref(0)
let intervalId: number | null = null

const currentWords = computed(() => {
  if (props.wordsByWeek.length === 0) return []
  return props.wordsByWeek[currentIndex.value]?.words || []
})

onMounted(() => {
  if (props.wordsByWeek.length > 1) {
    intervalId = setInterval(() => {
      currentIndex.value = (currentIndex.value + 1) % props.wordsByWeek.length
    }, 1000) as unknown as number
  }
})

onBeforeUnmount(() => {
  if (intervalId !== null) {
    clearInterval(intervalId)
  }
})
</script>
