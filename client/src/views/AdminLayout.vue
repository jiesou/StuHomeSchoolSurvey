<template>
  <a-layout style="min-height: 100vh">
    <a-layout-header style="background: #fff; padding: 0 24px">
      <div style="display: flex; align-items: center; justify-content: space-between">
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
    
    <a-layout-content style="margin: 24px; background: #fff; padding: 24px">
      <router-view />
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
  display: flex;
  align-items: center;
}
</style>