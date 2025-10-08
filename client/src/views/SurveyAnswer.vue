<template>
  <div class="survey-container">
    <a-card v-if="loading" style="text-align: center">
      <a-spin size="large" />
      <p style="margin-top: 16px">正在加载问卷...</p>
    </a-card>
    
    <a-card v-else-if="survey" :title="survey.title">
      <template #extra>
        <a-tag color="blue">{{ survey.year }}</a-tag>
        <a-tag color="green">{{ survey.semester === 1 ? '第一学期' : '第二学期' }}</a-tag>
        <a-tag>第{{ survey.week }}周</a-tag>
      </template>
      
      <p v-if="survey.description" style="margin-bottom: 24px; opacity: 0.65">
        {{ survey.description }}
      </p>
      
      <a-form
        :model="formState"
        layout="vertical"
        @finish="handleSubmit"
        @finishFailed="handleValidateFail"
        ref="formRef"
      >
        <!-- 用户信息 -->
        <a-divider>请填写您的信息</a-divider>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="姓名" name="name" :rules="{ required: true }">
              <a-input v-model:value="formState.name" placeholder="请输入姓名" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="学号" name="id_number" :rules="{ required: true }">
              <a-input v-model:value="formState.id_number" placeholder="请输入学号" />
            </a-form-item>
          </a-col>
        </a-row>
        
        <!-- 问题列表 -->
        <a-divider>问卷内容</a-divider>
        <div v-for="(question, index) in survey.questions" :key="question.id" class="question-item">
          <a-form-item 
            :label="`${index + 1}. ${question.description}`"
            :name="['answers', question.id]"
            :rules="[{ required: question.config.required }]"
          >
            <!-- 星级评分 -->
            <a-rate 
              v-if="question.config.type === 'star'"
              v-model:value="formState.answers[question.id] as number"
              :count="question.config.maxStars || 5"
              allow-clear
            />
            
            <!-- 文本输入 -->
            <a-textarea
              v-else-if="question.config.type === 'input'"
              v-model:value="formState.answers[question.id]"
              :placeholder="question.config.placeholder || '请输入您的回答'"
              :rows="3"
              :maxlength="question.config.maxLength"
              :show-count="!!question.config.maxLength"
            />
          </a-form-item>
        </div>
        
        <a-form-item style="text-align: center; margin-top: 32px">
          <a-button type="primary" html-type="submit" size="large" :loading="submitting">
            提交问卷
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>
    
    <a-result
      v-else-if="!loading && !survey"
      status="404"
      title="问卷不存在"
      sub-title="请检查问卷链接是否正确"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { apiService } from '../api'
import type { Survey, SubmitAnswersRequest, QuestionType, AnswerValue } from '../types'

interface Props {
  id: string
}

const props = defineProps<Props>()

const loading = ref(false)
const submitting = ref(false)
const survey = ref<Survey | null>(null)
const formRef = ref()

// LocalStorage key
const getStorageKey = () => `survey_answer_${props.id}`

const formState = reactive<{
  name: string;
  id_number: string;
  answers: Record<number, AnswerValue<QuestionType>>;
}>({
  name: '',
  id_number: '',
  answers: {}
})

// 从 LocalStorage 加载状态，但只加载当前问卷中存在的问题答案
function loadFormStateFromStorage() {
  try {
    const saved = localStorage.getItem(getStorageKey())
    if (saved && survey.value?.questions) {
      const data = JSON.parse(saved)
      formState.name = data.name || ''
      formState.id_number = data.id_number || ''
      
      // 只加载当前问卷中实际存在的问题答案
      const validQuestionIds = new Set(survey.value.questions.map(q => q.id))
      const savedAnswers = data.answers || {}
      formState.answers = {}
      
      // 过滤掉不再存在的问题ID
      Object.entries(savedAnswers).forEach(([questionId, value]) => {
        const id = parseInt(questionId)
        if (validQuestionIds.has(id)) {
          formState.answers[id] = value as AnswerValue<QuestionType>
        }
      })
    }
  } catch (error) {
    console.error('加载保存的表单数据失败：', error)
  }
}

// 保存状态到 LocalStorage
function saveFormStateToStorage() {
  try {
    localStorage.setItem(getStorageKey(), JSON.stringify({
      name: formState.name,
      id_number: formState.id_number,
      answers: formState.answers
    }))
  } catch (error) {
    console.error('保存表单数据失败：', error)
  }
}

// 监听表单状态变化，自动保存
watch(formState, () => {
  saveFormStateToStorage()
}, { deep: true })

async function loadSurvey() {
  loading.value = true
  try {
    survey.value = await apiService.getSurvey(parseInt(props.id))
    // 问卷加载后，从 LocalStorage 加载已保存的表单数据
    loadFormStateFromStorage()
    
    // 清理 formState.answers 中不再存在的问题ID
    if (survey.value?.questions) {
      const validQuestionIds = new Set(survey.value.questions.map(q => q.id))
      const currentAnswers = { ...formState.answers }
      formState.answers = {}
      
      Object.entries(currentAnswers).forEach(([questionId, value]) => {
        const id = parseInt(questionId)
        if (validQuestionIds.has(id)) {
          formState.answers[id] = value
        }
      })
    }
  } catch (error) {
    message.error('加载问卷失败：' + (error as Error).message)
    console.error('加载问卷失败：', error)
  } finally {
    loading.value = false
  }
}

function handleValidateFail({ values, errorFields, outOfDate }: any) {
  message.error('有必填项未填写')
  formRef.value?.scrollToField(errorFields[0].name, { behavior: 'smooth', block: 'center' })
}

async function handleSubmit(values: typeof formState) {
    submitting.value = true
    
    // 构建答案数组，只包含已回答的问题
    const answers: { question_id: number; value: string }[] = Object.entries(formState.answers)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .map(([id, value]) => ({
        question_id: parseInt(id),
        value: String(value)
      }))
    
    const submitData: SubmitAnswersRequest = {
      survey_id: parseInt(props.id),
      user: {
        name: formState.name,
        id_number: formState.id_number
      },
      answers
    }
    
    try {
      await apiService.submitAnswers(submitData)
      
      Modal.success({
        title: '提交成功',
        content: '感谢您的参与！',
        onOk() {
          // 可以在这里添加跳转逻辑
        }
      })
    } catch (error: any) {
      const errorMessage = error.message || String(error)
      if (errorMessage.includes('已经提交过')) {
        // 重复提交，显示确认对话框
        Modal.confirm({
          title: '您已提交过这份问卷',
          content: '但是您可以覆盖之前的回答',
          okText: '确认覆盖',
          onOk: async () => {
            await handleOverrideSubmit(submitData)
          }
        })
      } else {
        message.error('提交失败：' + errorMessage)
      }
      console.error('提交失败：', error)
    } finally {
      submitting.value = false
    }
}

// 覆盖提交
async function handleOverrideSubmit(submitData: SubmitAnswersRequest) {
  try {
    submitting.value = true
    await apiService.submitOverride(submitData)
    
    Modal.success({
      title: '提交成功',
      content: '已成功覆盖之前的回答，感谢您的参与！',
      onOk() {
        // 可以在这里添加跳转逻辑
      }
    })
  } catch (error: any) {
    message.error('覆盖提交失败：' + (error.message || String(error)))
    console.error('覆盖提交失败：', error)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadSurvey()
})
</script>

<style scoped>
.survey-container {
  max-width: 900px;
  margin: 24px auto;
  padding: 0;
}

@media (max-width: 768px) {
  .survey-container {
    margin: 16px auto;
  }
}

.question-item {
  margin-bottom: 24px;
  padding: 16px;
  border-radius: 6px;
}

.ant-form-item-label > label {
  font-weight: 500;
  font-size: 16px;
}
</style>
