<template>
  <a-layout style="min-height: 100vh">
    <a-layout-header style="background: #fff; padding: 0">
      <div class="header-content">
        <h1 style="margin: 0; color: #1890ff">家校互联问卷系统</h1>
        <a-space>
          <a-button type="primary" @click="$router.push('/admin')">
            问卷列表
          </a-button>
          <a-button @click="$router.push('/admin/create')">
            创建问卷
          </a-button>
        </a-space>
      </div>
    </a-layout-header>
    
    <a-layout-content class="content-wrapper">
      <div class="content-inner">
        <router-view />
      </div>
    </a-layout-content>
  </a-layout>
</template>

<script setup lang="ts">
// 管理端布局组件
</script>

<style scoped>
.ant-layout-header {
  position: sticky;
  top: 0;
  z-index: 1;
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
  background: #f5f5f5;
  padding: 24px 16px;
}

@media (min-width: 768px) {
  .content-wrapper {
    padding: 24px;
  }
}

.content-inner {
  max-width: 1400px;
  margin: 0 auto;
  background: #fff;
  padding: 24px;
  border-radius: 4px;
}
</style>
