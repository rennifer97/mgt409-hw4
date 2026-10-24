import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// /api and /media go to the FastAPI backend on port 8000.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:8000',
      '/media': 'http://127.0.0.1:8000',
    },
  },
})
