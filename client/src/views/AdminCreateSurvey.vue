<template>
  <div>
    <a-card title="创建问卷">
      <a-form
        :model="form"
        :rules="rules"
        layout="vertical"
        @finish="handleSubmit"
        ref="formRef"
      >
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="问卷标题" name="title">
              <a-input v-model:value="form.title" placeholder="请输入问卷标题" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="问卷描述" name="description">
              <a-input v-model:value="form.description" placeholder="请输入问卷描述（可选）" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="学年" name="year">
              <a-input-number 
                v-model:value="form.year" 
                :min="2020" 
                :max="2030"
                style="width: 100%"
                placeholder="如: 2024"
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="学期" name="semester">
              <a-select v-model:value="form.semester" placeholder="选择学期">
                <a-select-option :value="1">上学期</a-select-option>
                <a-select-option :value="2">下学期</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="周次" name="week">
              <a-input-number 
                v-model:value="form.week" 
                :min="1" 
                :max="20"
                style="width: 100%"
                placeholder="如: 1"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-divider>问题设置</a-divider>

        <div v-for="(question, index) in form.questions" :key="index" class="question-item">
          <a-card size="small" :title="`问题 ${index + 1}`">
            <template #extra>
              <a-button 
                type="text" 
                danger 
                size="small"
                @click="removeQuestion(index)"
                :disabled="form.questions.length <= 1"
              >
                删除
              </a-button>
            </template>

            <a-form-item :name="['questions', index, 'description']" label="问题描述">
              <a-input 
                v-model:value="question.description" 
                placeholder="请输入问题描述"
              />
            </a-form-item>

            <a-form-item :name="['questions', index, 'config', 'type']" label="问题类型">
              <a-radio-group v-model:value="question.config.type">
                <a-radio value="star">星级评价 (0-5星)</a-radio>
                <a-radio value="input">文本输入</a-radio>
              </a-radio-group>
            </a-form-item>

            <a-form-item>
              <a-checkbox v-model:checked="question.config.required">
                必填问题
              </a-checkbox>
            </a-form-item>
          </a-card>
        </div>

        <a-button 
          type="dashed" 
          block
          @click="addQuestion"
          style="margin: 16px 0"
        >
          <template #icon>
            <PlusOutlined />
          </template>
          添加问题
        </a-button>

        <a-form-item>
          <a-space>
            <a-button type="primary" html-type="submit" :loading="submitting">
              创建问卷
            </a-button>
            <a-button @click="resetForm">
              重置
            </a-button>
            <router-link to="/admin/surveys">
              <a-button>
                返回
              </a-button>
            </router-link>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { ApiService } from '../services/api'
import type { CreateSurveyRequest, CreateQuestionRequest } from '../types'

const router = useRouter()
const formRef = ref()
const submitting = ref(false)

const form = reactive<CreateSurveyRequest>({
  title: '',
  description: '',
  year: new Date().getFullYear(),
  semester: 1,
  week: 1,
  questions: [
    {
      description: '',
      config: { type: 'star', required: true },
      order: 1
    }
  ]
})

const rules = {
  title: [{ required: true, message: '请输入问卷标题' }],
  year: [{ required: true, message: '请选择学年' }],
  semester: [{ required: true, message: '请选择学期' }],
  week: [{ required: true, message: '请输入周次' }],
  questions: [{ required: true, message: '至少需要一个问题' }]
}

const addQuestion = () => {
  const newQuestion: CreateQuestionRequest = {
    description: '',
    config: { type: 'star', required: false },
    order: form.questions.length + 1
  }
  form.questions.push(newQuestion)
}

const removeQuestion = (index: number) => {
  if (form.questions.length > 1) {
    form.questions.splice(index, 1)
    // Reorder remaining questions
    form.questions.forEach((q, i) => {
      q.order = i + 1
    })
  }
}

const resetForm = () => {
  form.title = ''
  form.description = ''
  form.year = new Date().getFullYear()
  form.semester = 1
  form.week = 1
  form.questions = [
    {
      description: '',
      config: { type: 'star', required: true },
      order: 1
    }
  ]
  formRef.value?.resetFields()
}

const handleSubmit = async () => {
  try {
    // Validate that all questions have descriptions
    const hasEmptyQuestions = form.questions.some(q => !q.description?.trim())
    if (hasEmptyQuestions) {
      message.error('请填写所有问题的描述')
      return
    }

    submitting.value = true
    
    const survey = await ApiService.createSurvey(form)
    message.success('问卷创建成功！')
    router.push('/admin/surveys')
  } catch (error) {
    message.error('创建问卷失败，请重试')
    console.error('Error creating survey:', error)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.question-item {
  margin-bottom: 16px;
}
</style>