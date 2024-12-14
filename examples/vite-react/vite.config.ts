import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import autoDecimal from 'unplugin-auto-decimal/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [autoDecimal(), react()],
})
