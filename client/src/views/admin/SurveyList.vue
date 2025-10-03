<template>
  <div>
    <a-page-header title="问卷列表" />

    <div style="overflow-x: auto;">
      <a-table :dataSource="surveys" :columns="columns" :pagination="pagination" :loading="loading"
        :style="{ minWidth: '800px' }"
        @change="handleTableChange" rowKey="id">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'semester'">
            {{ record.semester === 1 ? '第一学期' : '第二学期' }}
          </template>

          <template v-if="column.key === 'actions'">
            <a-space>
              <a-button type="primary" size="small" @click="viewResults(record.id)">
                查看结果
              </a-button>
              <a-button size="small" @click="copyLink(record.id)">
                复制问卷链接
              </a-button>
              <a-dropdown>
                <template #overlay>
                  <a-menu @click="(e: any) => handleMenuClick(e, record as Survey)">
                    <a-menu-item key="clone">
                      <CopyOutlined />
                      克隆
                    </a-menu-item>
                    <a-menu-item key="edit">
                      <EditOutlined />
                      编辑
                    </a-menu-item>
                    <a-menu-divider />
                    <a-popconfirm
                      :title="`确定要删除问卷「${record.title}」吗？`"
                      ok-text="确定"
                      cancel-text="取消"
                      @confirm="deleteSurvey(record as Survey)"
                    >
                      <a-menu-item key="delete" danger>
                        <DeleteOutlined />
                        删除
                      </a-menu-item>
                    </a-popconfirm>
                  </a-menu>
                </template>
                <a-button size="small">
                  更多操作
                  <DownOutlined />
                </a-button>
              </a-dropdown>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { CopyOutlined, EditOutlined, DeleteOutlined, DownOutlined } from '@ant-design/icons-vue'
import { apiService } from '../../api'
import type { Survey, SurveyListResponse } from '../../types'

const router = useRouter()
const loading = ref(false)
const surveys = ref<Survey[]>([])
const pagination = ref({
  current: 1,
  pageSize: 10,
  pageSizeOptions: ['5', '10', '20', '50'],
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

function handleMenuClick(e: any, record: Survey) {
  switch (e.key) {
    case 'clone':
      cloneSurvey(record)
      break
    case 'edit':
      editSurvey(record.id)
      break
  }
}

function cloneSurvey(survey: Survey) {
  // 通过 router state 传递问卷数据
  router.push({
    path: '/admin/create',
    state: { cloneSurvey: JSON.parse(JSON.stringify(survey)) }
  })
}

function editSurvey(id: number) {
  router.push(`/admin/edit/${id}`)
}

async function deleteSurvey(survey: Survey) {
  try {
    await apiService.deleteSurvey(survey.id)
    message.success('问卷删除成功')
    loadSurveys()
  } catch (error) {
    message.error('删除失败：' + (error as Error).message)
  }
}

onMounted(() => {
  loadSurveys()
})
</script>