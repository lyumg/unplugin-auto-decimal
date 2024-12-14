import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue2'
import vueJsx from '@vitejs/plugin-vue2-jsx'
import AutoDecimal from 'unplugin-auto-decimal/vite'
import Inspect from 'vite-plugin-inspect'

export default defineConfig({
  plugins: [vue(), vueJsx(), AutoDecimal({ tailPatchZero: true}), Inspect()],
})
