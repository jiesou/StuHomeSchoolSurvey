<template>
  <div class="survey-container">
    <a-card v-if="loading" style="text-align: center">
      <a-spin size="large" />
      <p style="margin-top: 16px">正在加载问卷...</p>
    </a-card>
    
    <a-card v-else-if="survey" :title="survey.title">
      <template #extra>
        <a-tag color="blue">{{ survey.year }}</a-tag>
        <a-tag color="green">{{ survey.semester === 1 ? '上学期' : '下学期' }}</a-tag>
        <a-tag>第{{ survey.week }}周</a-tag>
      </template>
      
      <p v-if="survey.description" style="margin-bottom: 24px; color: #666">
        {{ survey.description }}
      </p>
      
      <a-form
        :model="formState"
        layout="vertical"
        @finish="handleSubmit"
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
              v-model:value="formState.answers[question.id]"
              :count="question.config.maxStars || 5"
              allow-clear
            />
            
            <!-- 文本输入 -->
            <a-textarea
              v-else-if="question.config.type === 'input'"
              v-model:value="formState.answers[question.id]"
              :placeholder="question.config.placeholder || '请输入您的回答'"
              :rows="3"
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
    
    <!-- 提交成功对话框 -->
    <a-modal
      v-model:open="showSuccessModal"
      title="提交成功"
      :footer="null"
      :closable="false"
    >
      <a-result
        status="success"
        title="问卷提交成功"
        sub-title="感谢您的参与！"
      >
        <template #extra>
          <a-button type="primary" @click="showSuccessModal = false">
            确定
          </a-button>
        </template>
      </a-result>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { apiService } from '../api'
import type { Survey, SubmitAnswersRequest, QuestionType, AnswerValue } from '../types'

interface Props {
  id: string
}

const props = defineProps<Props>()

const loading = ref(false)
const submitting = ref(false)
const survey = ref<Survey | null>(null)
const showSuccessModal = ref(false)
const formRef = ref()


const formState = reactive<{
  name: string;
  id_number: string;
  answers: Record<number, AnswerValue<QuestionType>>;
}>({
  name: '',
  id_number: '',
  answers: {}
})

async function loadSurvey() {
  loading.value = true
  try {
    survey.value = await apiService.getSurvey(parseInt(props.id))
  } catch (error) {
    message.error('加载问卷失败：' + (error as Error).message)
    console.error('加载问卷失败：', error)
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
    
    if (!survey.value) return
    
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
    
    await apiService.submitAnswers(submitData)
    showSuccessModal.value = true
  } catch (error) {
    const errorMessage = (error as Error).message
    if (errorMessage.includes('已经提交过')) {
      message.warning('您已经提交过这份问卷，不能重复提交')
    } else {
      message.error('提交失败：' + errorMessage)
    }
    console.error('提交失败：', error)
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
  background: #fafafa;
  border-radius: 6px;
}

.ant-form-item-label > label {
  font-weight: 500;
  font-size: 16px;
}
</style>
