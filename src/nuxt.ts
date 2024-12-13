import { addVitePlugin, addWebpackPlugin, defineNuxtModule } from '@nuxt/kit'
import type { AutoDecimalOptions } from './types'
import unplugin from '.'
import '@nuxt/schema'

export interface ModuleOptions extends AutoDecimalOptions {

}

export default defineNuxtModule<ModuleOptions>({
  setup(options, _nuxt) {
    addVitePlugin(() => unplugin.vite(options))
    addWebpackPlugin(() => unplugin.webpack(options))

    // ...
  },
})
