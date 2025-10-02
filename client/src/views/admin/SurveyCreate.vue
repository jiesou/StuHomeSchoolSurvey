<template>
  <div>
    <a-page-header 
      :title="isEditMode ? '编辑问卷' : '创建问卷'" 
      @back="$router.push('/admin')"
    />
    
    <a-spin :spinning="loading" tip="加载中...">
      <a-form
        :model="formData"
        :rules="rules"
        layout="vertical"
        @finish="handleSubmit"
        ref="formRef"
      >
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="问卷标题" name="title">
              <a-input v-model:value="formData.title" placeholder="请输入问卷标题" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="学年" name="year">
              <a-input v-model:value="formData.year" placeholder="如：2023-2024" />
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="学期" name="semester">
              <a-select v-model:value="formData.semester" placeholder="请选择学期">
                <a-select-option :value="1">第一学期</a-select-option>
                <a-select-option :value="2">第二学期</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="周次" name="week">
              <a-input-number 
                v-model:value="formData.week" 
                :min="1" 
                :max="30" 
                placeholder="第几周"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-form-item label="问卷描述" name="description">
          <a-textarea 
            v-model:value="formData.description" 
            :rows="3" 
            placeholder="问卷说明（可选）"
          />
        </a-form-item>
        
        <a-divider>问题设置</a-divider>
        
        <div v-for="(question, index) in formData.questions" :key="index" class="question-item">
          <a-card size="small" :title="`问题 ${index + 1}`">
            <template #extra>
              <a-button 
                type="text" 
                danger 
                size="small"
                @click="removeQuestion(index)"
                :disabled="formData.questions.length <= 1"
              >
                删除
              </a-button>
            </template>
            
            <a-form-item label="问题描述">
              <a-input 
                v-model:value="question.description" 
                placeholder="请输入问题描述"
              />
            </a-form-item>
            
            <a-form-item label="问题类型">
              <a-select v-model:value="question.config.type" @change="onQuestionTypeChange(index)">
                <a-select-option value="star">星级评分</a-select-option>
                <a-select-option value="input">文本输入</a-select-option>
              </a-select>
            </a-form-item>
            
            <a-form-item v-if="question.config.type === 'star'" label="最大星数">
              <a-input-number 
                v-model:value="question.config.maxStars" 
                :min="3" 
                :max="10" 
                style="width: 100%"
              />
            </a-form-item>
            
            <a-form-item v-if="question.config.type === 'input'" label="输入提示">
              <a-input 
                v-model:value="question.config.placeholder" 
                placeholder="请输入提示文字"
              />
            </a-form-item>
            
            <a-form-item label="是否必填">
              <a-checkbox v-model:checked="question.config.required" />
            </a-form-item>
          </a-card>
        </div>
        
        <a-button type="dashed" @click="addQuestion" block style="margin-bottom: 24px">
          + 添加问题
        </a-button>
        
        <a-form-item>
          <a-space>
            <a-button type="primary" html-type="submit" :loading="submitting">
              {{ isEditMode ? '保存修改' : '创建问卷' }}
            </a-button>
            <a-button @click="$router.push('/admin')">
              取消
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import { apiService } from '../../api'
import type { CreateSurveyRequest, Survey } from '../../types'
import { QuestionType } from '../../types'

const router = useRouter()
const route = useRoute()
const formRef = ref()
const submitting = ref(false)
const loading = ref(false)

// 编辑模式：路由参数中有 id
const editId = computed(() => {
  const id = route.params.id
  return id ? parseInt(id as string) : null
})

const isEditMode = computed(() => !!editId.value)

const formData = reactive<CreateSurveyRequest>({
  title: '',
  description: '',
  year: '',
  semester: 1,
  week: 1,
  questions: [
    {
      description: '',
      config: {
        type: QuestionType.STAR,
        maxStars: 5,
        required: true
      }
    }
  ]
})

const rules = {
  title: [{ required: true, message: '请输入问卷标题' }],
  year: [{ required: true, message: '请输入学年' }],
  semester: [{ required: true, message: '请选择学期' }],
  week: [{ required: true, message: '请输入周次' }]
}

// 加载问卷数据（用于编辑）
async function loadSurvey(id: number) {
  loading.value = true
  try {
    const survey = await apiService.getSurvey(id)
    formData.title = survey.title
    formData.description = survey.description || ''
    formData.year = survey.year
    formData.semester = survey.semester
    formData.week = survey.week
    
    if (survey.questions && survey.questions.length > 0) {
      formData.questions = survey.questions.map(q => ({
        description: q.description || '',
        config: q.config
      }))
    }
  } catch (error) {
    message.error('加载问卷失败：' + (error as Error).message)
    router.push('/admin')
  } finally {
    loading.value = false
  }
}

// 初始化表单数据（用于克隆）
function initializeFormData(survey: Survey) {
  formData.title = `${survey.title} - 副本`
  formData.description = survey.description || ''
  formData.year = survey.year
  formData.semester = survey.semester
  formData.week = survey.week
  
  if (survey.questions && survey.questions.length > 0) {
    formData.questions = survey.questions.map(q => ({
      description: q.description || '',
      config: q.config
    }))
  }
}

function addQuestion() {
  formData.questions.push({
    description: '',
    config: {
      type: QuestionType.STAR,
      maxStars: 5,
      required: true
    }
  })
}

function removeQuestion(index: number) {
  if (formData.questions.length > 1) {
    formData.questions.splice(index, 1)
  }
}

function onQuestionTypeChange(index: number) {
  const question = formData.questions[index]
  if (!question) return
  
  if (question.config.type === QuestionType.STAR) {
    question.config.maxStars = 5
    delete question.config.placeholder
  } else {
    question.config.placeholder = ''
    delete question.config.maxStars
  }
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
    
    submitting.value = true
    if (isEditMode.value && editId.value) {
      await apiService.updateSurvey(editId.value, formData)
      message.success('问卷更新成功')
    } else {
      await apiService.createSurvey(formData)
      message.success('问卷创建成功')
    }
    router.push('/admin')
  } catch (error) {
    message.error((isEditMode.value ? '更新' : '创建') + '失败：' + (error as Error).message)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  // 处理克隆：通过 router state 传递数据
  const cloneSurvey = history.state?.cloneSurvey as Survey | undefined
  if (cloneSurvey) {
    initializeFormData(cloneSurvey)
  } else if (editId.value) {
    // 编辑模式：加载问卷数据
    loadSurvey(editId.value)
  }
})
</script>

<style scoped>
.question-item {
  margin-bottom: 16px;
}
</style>