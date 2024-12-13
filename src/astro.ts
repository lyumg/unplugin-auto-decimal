import type { AutoDecimalOptions } from './types'

import unplugin from '.'

export default (options: AutoDecimalOptions): any => ({
  name: 'unplugin-auto-decimal',
  hooks: {
    'astro:config:setup': async (astro: any) => {
      astro.config.vite.plugins ||= []
      astro.config.vite.plugins.push(unplugin.vite(options))
    },
  },
})
