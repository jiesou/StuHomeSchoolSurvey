<template>
  <div>
    <a-page-header title="问卷列表" />
    
    <a-table 
      :dataSource="surveys" 
      :columns="columns"
      :pagination="pagination"
      :loading="loading"
      @change="handleTableChange"
      rowKey="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'semester'">
          {{ record.semester === 1 ? '上学期' : '下学期' }}
        </template>
        
        <template v-if="column.key === 'actions'">
          <a-space>
            <a-button 
              type="primary" 
              size="small"
              @click="viewResults(record.id)"
            >
              查看结果
            </a-button>
            <a-button 
              size="small"
              @click="copyLink(record.id)"
            >
              复制链接
            </a-button>
          </a-space>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { apiService } from '../../api'
import type { Survey, SurveyListResponse } from '../../types'

const router = useRouter()
const loading = ref(false)
const surveys = ref<Survey[]>([])
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`
})

const columns = [
  {
    title: '问卷标题',
    dataIndex: 'title',
    key: 'title',
  },
  {
    title: '学年',
    dataIndex: 'year',
    key: 'year',
  },
  {
    title: '学期',
    dataIndex: 'semester',
    key: 'semester',
  },
  {
    title: '周次',
    dataIndex: 'week',
    key: 'week',
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'created_at',
    customRender: ({ text }: { text: string }) => new Date(text).toLocaleString()
  },
  {
    title: '操作',
    key: 'actions',
  }
]

async function loadSurveys() {
  loading.value = true
  try {
    const response: SurveyListResponse = await apiService.getSurveys(
      pagination.value.current, 
      pagination.value.pageSize
    )
    surveys.value = response.surveys
    pagination.value.total = response.total
  } catch (error) {
    message.error('加载问卷列表失败：' + (error as Error).message)
  } finally {
    loading.value = false
  }
}

function handleTableChange(pag: any) {
  pagination.value.current = pag.current
  pagination.value.pageSize = pag.pageSize
  loadSurveys()
}

function viewResults(id: number) {
  router.push(`/admin/surveys/${id}/results`)
}

function copyLink(id: number) {
  const link = `${window.location.origin}/survey/${id}`
  navigator.clipboard.writeText(link).then(() => {
    message.success('问卷链接已复制到剪贴板')
  }).catch(() => {
    message.error('复制失败，请手动复制：' + link)
  })
}

onMounted(() => {
  loadSurveys()
})
</script>