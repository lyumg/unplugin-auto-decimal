import { createUnplugin } from 'unplugin'
import type { AutoDecimalOptions } from '../types'
import { createContext } from './context'

export default createUnplugin<AutoDecimalOptions | undefined>((options) => {
  const ctx = createContext(options)
  return {
    name: 'unplugin-auto-decimal',
    enforce: 'pre',
    transformInclude(id) {
      return ctx.filter(id)
    },
    transform(code, id) {
      return ctx.transform(code, id)
    },
  }
})
