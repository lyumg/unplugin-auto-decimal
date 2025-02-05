import { createUnplugin } from 'unplugin'
import { createFilter } from 'vite'
import type { MagicStringAST } from 'magic-string-ast'
import type { AutoDecimalOptions } from '../types'
import { REGEX_NODE_MODULES, REGEX_SUPPORTED_EXT, REGEX_VUE } from './constant'
import { transformAutoDecimal, transformVueAutoDecimal } from './transform'

export function transform(code: string, id: string, options?: AutoDecimalOptions) {
  let msa: MagicStringAST
  if (REGEX_VUE.some(reg => reg.test(id))) {
    msa = transformVueAutoDecimal(code, options)
  }
  else {
    msa = transformAutoDecimal(code, options)
  }
  if (!msa.hasChanged())
    return
  return {
    code: msa.toString(),
    map: msa.generateMap({ source: id, includeContent: true, hires: true }),
  }
}
export default createUnplugin<AutoDecimalOptions | undefined>((options) => {
  const filter = createFilter(
    [REGEX_SUPPORTED_EXT, ...REGEX_VUE],
    [REGEX_NODE_MODULES],
  )
  return {
    name: 'unplugin-auto-decimal',
    enforce: 'pre',
    transformInclude(id) {
      return filter(id)
    },
    transform(code, id) {
      return transform(code, id, options)
    },
  }
})
