<template>
  <div>
    <a-page-header 
      :title="surveyIds.length === 1 ? '统计洞察' : '跨问卷聚合分析'" 
      @back="() => router.back()"
    >
      <template #subTitle>
        <span v-if="surveyIds.length > 1">已选择 {{ surveyIds.length }} 个问卷</span>
      </template>
    </a-page-header>

    <div style="padding: 24px;">
      <Insights :surveyIds="surveyIds" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import Insights from '../../components/Insights.vue'

const router = useRouter()
const route = useRoute()

const surveyIds = ref<number[]>([])

onMounted(() => {
  // 解析 URL 参数
  const surveysParam = route.query.surveys as string
  if (!surveysParam) {
    message.error('缺少问卷参数')
    router.back()
    return
  }

  surveyIds.value = surveysParam.split(',').map(id => parseInt(id)).filter(id => !isNaN(id))
})
</script>
