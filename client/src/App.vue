<template>
  <div id="container">
    <a-config-provider :locale="zhCN" :theme="themeConfig">
      <router-view />
    </a-config-provider>
  </div>
</template>

<script setup lang="ts">
// 主应用组件
import { ref, onMounted, onBeforeUnmount } from 'vue';
import zhCN from 'ant-design-vue/es/locale/zh_CN';
import { theme } from 'ant-design-vue';

// 检测系统深色模式
const isDarkMode = ref(false);
const mediaQuery = ref<MediaQueryList | null>(null);

// 主题配置
const themeConfig = ref({
  algorithm: theme.defaultAlgorithm
});

// 更新主题
function updateTheme(dark: boolean) {
  isDarkMode.value = dark;
  themeConfig.value = {
    algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm
  };
}

// 监听系统深色模式变化
function handleColorSchemeChange(e: MediaQueryListEvent) {
  updateTheme(e.matches);
}

onMounted(() => {
  // 检测系统深色模式偏好
  mediaQuery.value = window.matchMedia('(prefers-color-scheme: dark)');
  updateTheme(mediaQuery.value.matches);
  
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
