import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const apiTarget = process.env.VITE_API_TARGET ?? 'http://127.0.0.1:5080'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../WaaaHa!-patcher.API/wwwroot',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    // В разработке фронтенд живёт на отдельном порту и ходит в API на случайный порт,
    // который приложение выбирает само. Адрес задаётся переменной окружения.
    proxy: {
      '/api': { target: apiTarget, changeOrigin: true },
    },
  },
})