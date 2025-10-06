<template>
  <div class="login-container">
    <a-card class="login-card" title="管理员登录">
      <a-form
        :model="formState"
        :rules="rules"
        @finish="handleLogin"
        layout="vertical"
      >
        <a-form-item label="账号" name="id_number">
          <a-input
            v-model:value="formState.id_number"
            placeholder="请输入账号"
            size="large"
          />
        </a-form-item>

        <a-form-item label="密码" name="password">
          <a-input-password
            v-model:value="formState.password"
            placeholder="请输入密码"
            size="large"
          />
        </a-form-item>

        <a-form-item>
          <a-button
            type="primary"
            html-type="submit"
            size="large"
            block
            :loading="loading"
          >
            登录
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { apiService } from '../api'

const router = useRouter()
const loading = ref(false)

const formState = reactive({
  id_number: '',
  password: ''
})

const rules = {
  id_number: [{ required: true, message: '请输入账号' }],
  password: [{ required: true, message: '请输入密码' }]
}

const handleLogin = async () => {
  loading.value = true
  try {
    const response = await apiService.login(formState.id_number, formState.password)
    
    // 存储 token 和用户信息到 sessionStorage
    sessionStorage.setItem('token', response.token)
    sessionStorage.setItem('user', JSON.stringify(response.user))
    
    message.success('登录成功')
    
    // 跳转到管理页面
    router.push('/admin')
  } catch (error: any) {
    message.error(error.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
}

.login-card {
  width: 100%;
  max-width: 400px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.login-card :deep(.ant-card-head) {
  text-align: center;
  font-size: 24px;
  font-weight: 600;
}
</style>
