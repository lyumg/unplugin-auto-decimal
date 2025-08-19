import { defineConfig } from 'vitest/config'
import AutoDecimal from './src/vite'

export default defineConfig({
  plugins: [AutoDecimal()],
  test: {
    include: ['test/**/*.test.ts'],
  },
})
