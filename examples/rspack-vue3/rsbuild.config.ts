import { defineConfig } from '@rsbuild/core';
import { pluginVue } from '@rsbuild/plugin-vue';
import AutoDecimal from 'unplugin-auto-decimal/rspack'
export default defineConfig({
  plugins: [pluginVue()],
  tools: {
    rspack: {
      plugins: [AutoDecimal({tailPatchZero: true})]
    }
  }
});
