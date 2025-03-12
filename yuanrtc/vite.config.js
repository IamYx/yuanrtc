import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  publicPath: '/yuanrtc/',
  outputDir: 'dist',
  server: {
    port: 8080,
    host: true,
  }
})