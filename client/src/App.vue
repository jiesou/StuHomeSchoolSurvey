<template style="min-height: 100vh; background-color: #f5f5f5">
  <div id="container">
    <a-config-provider :locale="zhCN">
      <router-view />
    </a-config-provider>
  </div>
</template>

<script setup lang="ts">
// 主应用组件
import zhCN from 'ant-design-vue/es/locale/zh_CN';
</script>

<style>
#container {
  min-height: 100vh;
  background-color: #f5f5f5; 
}
</style>
