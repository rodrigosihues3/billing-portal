import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api-decolecta': {
        target: 'https://api.decolecta.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-decolecta/, '')
      }
    }
  }
})