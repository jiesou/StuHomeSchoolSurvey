<template>
  <div style="max-width: 800px; margin: 0 auto">
    <a-spin :spinning="loading">
      <a-card v-if="survey" :title="survey.title">
        <template #extra>
          <a-tag color="blue">
            {{ survey.year }}年第{{ survey.semester }}学期第{{ survey.week }}周
          </a-tag>
        </template>

        <div v-if="survey.description" style="margin-bottom: 24px">
          <p>{{ survey.description }}</p>
        </div>

        <a-form
          :model="form"
          :rules="rules"
          layout="vertical"
          @finish="handleSubmit"
          ref="formRef"
          v-if="!submitted"
        >
          <a-divider>个人信息</a-divider>
          
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="姓名" name="name">
                <a-input v-model:value="form.name" placeholder="请输入您的姓名" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="学号" name="idNumber">
                <a-input v-model:value="form.idNumber" placeholder="请输入学号" />
              </a-form-item>
            </a-col>
          </a-row>

          <a-divider>问卷内容</a-divider>

          <div v-for="(question, index) in survey.questions" :key="question.id" style="margin-bottom: 24px">
            <div style="margin-bottom: 12px">
              <span style="font-weight: 500">
                {{ index + 1 }}. {{ question.description }}
                <span v-if="question.config.required" style="color: #ff4d4f">*</span>
              </span>
            </div>

            <!-- Star Rating Question -->
            <a-form-item 
              v-if="question.config.type === 'star'" 
              :name="['answers', question.id]"
              :rules="question.config.required ? [{ required: true, message: '请选择评分' }] : []"
            >
              <a-rate 
                v-model:value="form.answers[question.id]" 
                :count="5"
                allow-half
              />
              <div style="margin-top: 8px; color: #666; font-size: 12px">
                0 = 很不满意，5 = 非常满意
              </div>
            </a-form-item>

            <!-- Text Input Question -->
            <a-form-item 
              v-if="question.config.type === 'input'" 
              :name="['answers', question.id]"
              :rules="question.config.required ? [{ required: true, message: '请填写此项' }] : []"
            >
              <a-textarea 
                v-model:value="form.answers[question.id]" 
                :rows="3"
                placeholder="请输入您的回答..."
                show-count
                :maxlength="500"
              />
            </a-form-item>
          </div>

          <a-form-item>
            <a-button type="primary" html-type="submit" :loading="submitting" size="large" block>
              提交问卷
            </a-button>
          </a-form-item>
        </a-form>

        <!-- Success Message -->
        <a-result
          v-if="submitted"
          status="success"
          title="问卷提交成功！"
          sub-title="感谢您的参与，您的反馈对我们很重要。"
        >
          <template #extra>
            <a-button type="primary" @click="resetForm">
              再次填写
            </a-button>
          </template>
        </a-result>
      </a-card>

      <!-- Survey not found -->
      <a-result
        v-else-if="!loading"
        status="404"
        title="问卷未找到"
        sub-title="抱歉，您访问的问卷不存在或已被删除。"
      />
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { message } from 'ant-design-vue'
import { ApiService } from '../services/api'
import type { Survey, SubmitSurveyRequest } from '../types'

interface Props {
  id: string
}

const props = defineProps<Props>()

const survey = ref<Survey | null>(null)
const loading = ref(true)
const submitting = ref(false)
const submitted = ref(false)
const formRef = ref()

const form = reactive<{
  name: string
  idNumber: string
  answers: Record<string, any>
}>({
  name: '',
  idNumber: '',
  answers: {}
})

const rules = {
  name: [{ required: true, message: '请输入您的姓名' }],
  idNumber: [{ required: true, message: '请输入学号' }]
}

const loadSurvey = async () => {
  loading.value = true
  try {
    survey.value = await ApiService.getSurvey(props.id)
    
    // Initialize answer fields
    if (survey.value?.questions) {
      survey.value.questions.forEach(question => {
        form.answers[question.id] = question.config.type === 'star' ? 0 : ''
      })
    }
  } catch (error) {
    console.error('Error loading survey:', error)
    survey.value = null
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  try {
    submitting.value = true

    // Prepare submission data
    const submitData: SubmitSurveyRequest = {
      name: form.name,
      idNumber: form.idNumber,
      answers: Object.entries(form.answers).map(([questionId, value]) => ({
        questionId,
        value: String(value)
      }))
    }

    await ApiService.submitSurvey(props.id, submitData)
    submitted.value = true
    message.success('问卷提交成功！')
  } catch (error: any) {
    if (error.response?.status === 409) {
      message.error('您已经提交过此问卷，无需重复提交')
    } else {
      message.error('提交失败，请重试')
    }
    console.error('Error submitting survey:', error)
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  submitted.value = false
  form.name = ''
  form.idNumber = ''
  
  if (survey.value?.questions) {
    survey.value.questions.forEach(question => {
      form.answers[question.id] = question.config.type === 'star' ? 0 : ''
    })
  }
  
  formRef.value?.resetFields()
}

onMounted(() => {
  loadSurvey()
})
</script>

<style scoped>
:deep(.ant-rate) {
  font-size: 24px;
}

:deep(.ant-result-title) {
  color: #52c41a;
}
</style>