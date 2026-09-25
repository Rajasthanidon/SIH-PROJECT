import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  let apiUrl = env.VITE_API_URL || 'http://localhost:4000/api'
  
  // Phase 24: Force same-origin Vercel proxy for production to solve 3rd-party cookie issues
  if (apiUrl.includes('sih-project-y3vp.onrender.com') || mode === 'production') {
    apiUrl = '/api'
  }

  apiUrl = apiUrl.replace(/\/+$/, '')
  if (!apiUrl.endsWith('/api')) {
    apiUrl += '/api'
  }

  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl)
    }
  }
})
