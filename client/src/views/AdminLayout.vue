<template>
    <a-layout-header class="header-content">
        <h1>家校互联问卷系统</h1>
        <a-space>
          <a-button type="primary" @click="navigateToList">
            问卷列表
          </a-button>
          <a-button @click="navigateToCreate">
            创建问卷
          </a-button>
        </a-space>
    </a-layout-header>
    
    <a-layout-content class="content-wrapper">
        <router-view />
    </a-layout-content>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

// 获取当前的 secret
const getAdminSecret = () => sessionStorage.getItem('adminSecret') || ''

const navigateToList = () => {
  router.push(`/admin-${getAdminSecret()}`)
}

const navigateToCreate = () => {
  router.push(`/admin-${getAdminSecret()}/create`)
}
</script>

<style scoped>
.ant-layout-header {
  position: sticky;
  top: 0;
  z-index: 3; /* 1 会比 table 低 */
  width: 100%;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 16px;
}

@media (min-width: 768px) {
  .header-content {
    padding: 0 24px;
  }
}

@media (min-width: 1200px) {
  .header-content {
    padding: 0 32px;
  }
}

.content-wrapper {
  padding: 24px 16px;
}

@media (min-width: 768px) {
  .content-wrapper {
    padding: 24px;
  }
}

.header-content h1 {
  color: #f5f5f5;
  margin: 0;
  font-size: 1.5rem;
}

@media (max-width: 767px) {
  .header-content h1 {
    font-size: 1.1rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
