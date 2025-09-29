<template>
  <div>
    <a-card title="问卷管理">
      <template #extra>
        <router-link to="/admin/surveys/create">
          <a-button type="primary">创建问卷</a-button>
        </router-link>
      </template>

      <a-table 
        :columns="columns" 
        :data-source="surveys" 
        :pagination="pagination"
        :loading="loading"
        @change="handleTableChange"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'period'">
            {{ record.year }}年第{{ record.semester }}学期第{{ record.week }}周
          </template>
          <template v-if="column.key === 'submissionCount'">
            <a-badge :count="record.submissionCount" style="background-color: #52c41a" />
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
                @click="copyPublicLink(record.id)"
              >
                复制链接
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- Copy success message -->
    <a-modal
      v-model:open="linkModalVisible"
      title="问卷链接"
      :footer="null"
    >
      <div style="text-align: center">
        <p>问卷链接已复制到剪贴板:</p>
        <a-input 
          :value="publicLink" 
          readonly
          style="margin: 16px 0"
        />
        <p style="color: #666; font-size: 12px">
          家长可通过此链接填写问卷
        </p>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { ApiService } from '../services/api'
import type { Survey, PaginatedResponse } from '../types'

const router = useRouter()

const surveys = ref<Survey[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const linkModalVisible = ref(false)
const publicLink = ref('')

const columns = [
  {
    title: '问卷标题',
    dataIndex: 'title',
    key: 'title',
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
    ellipsis: true,
  },
  {
    title: '学期',
    key: 'period',
  },
  {
    title: '提交数量',
    key: 'submissionCount',
    align: 'center' as const,
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    render: (date: Date) => new Date(date).toLocaleString('zh-CN'),
  },
  {
    title: '操作',
    key: 'actions',
    align: 'center' as const,
  },
]

const pagination = computed(() => ({
  current: currentPage.value,
  pageSize: pageSize.value,
  total: total.value,
  showSizeChanger: true,
  showQuickJumper: true,
  pageSizeOptions: ['10', '20', '50'],
  showTotal: (total: number, range: number[]) => 
    `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
}))

const loadSurveys = async () => {
  loading.value = true
  try {
    const response: PaginatedResponse<Survey> = await ApiService.getSurveys(
      currentPage.value,
      pageSize.value
    )
    surveys.value = response.data
    total.value = response.pagination.total
  } catch (error) {
    message.error('加载问卷列表失败')
    console.error('Error loading surveys:', error)
  } finally {
    loading.value = false
  }
}

const handleTableChange = (pag: any) => {
  currentPage.value = pag.current
  pageSize.value = pag.pageSize
  loadSurveys()
}

const viewResults = (surveyId: string) => {
  router.push(`/admin/surveys/${surveyId}/results`)
}

const copyPublicLink = (surveyId: string) => {
  publicLink.value = `${window.location.origin}/survey/${surveyId}`
  
  // Copy to clipboard
  if (navigator.clipboard) {
    navigator.clipboard.writeText(publicLink.value).then(() => {
      linkModalVisible.value = true
      message.success('链接已复制到剪贴板')
    }).catch(() => {
      linkModalVisible.value = true
      message.warning('请手动复制链接')
    })
  } else {
    linkModalVisible.value = true
    message.warning('请手动复制链接')
  }
}

onMounted(() => {
  loadSurveys()
})
</script>