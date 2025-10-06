<template>
  <a-config-provider :locale="zhCN" :theme="themeConfig">
    <a-layout id="container" style="min-height: 100vh;">
        <router-view />
    </a-layout>
  </a-config-provider>
</template>

<script setup lang="ts">
// 主应用组件
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import zhCN from 'ant-design-vue/es/locale/zh_CN';
import { theme } from 'ant-design-vue';

// 检测系统深色模式
const isDarkMode = ref(false);
const mediaQuery = ref<MediaQueryList | null>(null);

// 主题配置
const themeConfig = computed(() => ({
  algorithm: isDarkMode.value ? theme.darkAlgorithm : theme.defaultAlgorithm
}));
// 监听系统深色模式变化
function handleColorSchemeChange(e: MediaQueryListEvent) {
  isDarkMode.value = e.matches;
}

onMounted(() => {
  // 检测系统深色模式偏好
  mediaQuery.value = window.matchMedia('(prefers-color-scheme: dark)');
  isDarkMode.value = mediaQuery.value.matches;
  
  // 监听系统深色模式变化
  mediaQuery.value.addEventListener('change', handleColorSchemeChange);
});

onBeforeUnmount(() => {
  // 清理监听器
  if (mediaQuery.value) {
    mediaQuery.value.removeEventListener('change', handleColorSchemeChange);
  }
});
</script>

<style>
#container {
  min-height: 100vh;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}
</style>
