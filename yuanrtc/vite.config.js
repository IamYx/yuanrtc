import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 8080,
    host: true,
    proxy: {
      '/api': {
        target: 'https://v1.jinrishici.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        // 添加以下配置解决CORS问题
        headers: {
          Referer: 'https://service.jinrishici.com'
        }
      }
    }
  }
})