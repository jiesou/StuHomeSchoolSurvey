<template>
  <div class="user-info">
    <a-dropdown v-if="user" placement="bottomRight">
      <a-button type="text">
        {{ user.name }}
      </a-button>
      <template #overlay>
        <a-menu>
          <a-menu-item key="logout" @click="handleLogout">
            <span>退出登录</span>
          </a-menu-item>
        </a-menu>
      </template>
    </a-dropdown>
    
    <a-button v-else type="primary" @click="handleLogin">
      登录
    </a-button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import type { User } from '../types'

const router = useRouter()
const user = ref<User | null>(null)

// 加载用户信息
const loadUser = () => {
  const userStr = sessionStorage.getItem('user')
  if (userStr) {
    try {
      user.value = JSON.parse(userStr)
    } catch (e) {
      console.error('解析用户信息失败:', e)
      user.value = null
    }
  }
}

// 处理登录
const handleLogin = () => {
  router.push('/login')
}

// 处理退出登录
const handleLogout = () => {
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('user')
  user.value = null
  message.success('已退出登录')
  router.push('/login')
}

onMounted(() => {
  loadUser()
})
</script>

<style scoped>
.user-info {
  display: flex;
  align-items: center;
}
</style>
