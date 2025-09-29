<template>
  <a-config-provider>
    <div id="app">
      <a-layout style="min-height: 100vh">
        <a-layout-header style="background: #fff; padding: 0 24px; box-shadow: 0 2px 8px #f0f1f2">
          <div style="display: flex; align-items: center; height: 64px">
            <h1 style="margin: 0; color: #1890ff">家校互联问卷系统</h1>
            <div style="margin-left: auto">
              <a-space>
                <router-link to="/admin/surveys">
                  <a-button type="link">管理问卷</a-button>
                </router-link>
              </a-space>
            </div>
          </div>
        </a-layout-header>
        <a-layout-content style="padding: 24px; background: #f0f2f5">
          <router-view />
        </a-layout-content>
      </a-layout>
    </div>
  </a-config-provider>
</template>

<script setup lang="ts">
// No additional script needed for basic layout
</script>

<style>
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
</style>
