import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // 将 Vue 核心库单独打包
          if (id.includes('node_modules/vue') || id.includes('node_modules/@vue') || id.includes('node_modules/vue-router')) {
            return 'vue-vendor';
          }
          // 将 Ant Design Vue 单独打包
          if (id.includes('node_modules/ant-design-vue')) {
            return 'antdv';
          }
          // 将 Ant Design 图标单独打包（仅在实际使用时）
          if (id.includes('node_modules/@ant-design/icons-vue')) {
            return 'antdv-icons';
          }
        }
      }
    },
    // 减小 chunk 大小警告阈值
    chunkSizeWarningLimit: 600
  }
});
