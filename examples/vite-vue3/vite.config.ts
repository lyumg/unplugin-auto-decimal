import * as path from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import Inspect from 'vite-plugin-inspect'
import AutoDecimal from 'unplugin-auto-decimal/vite'
// https://vitejs.dev/config/
export default defineConfig({

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    minify: false,
  },
  plugins: [AutoDecimal({ supportNewFunction: true, toDecimal: false }), vue(), vueJsx(), Inspect()],
  server: {
    port: 8080,
    hmr: {
      host: 'localhost',
      port: 8080,
    },
  },
})
