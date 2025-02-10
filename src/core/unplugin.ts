import { createUnplugin } from 'unplugin'
import { createFilter } from '@rollup/pluginutils'
import type { MagicStringAST } from 'magic-string-ast'
import type { AutoDecimalOptions, InnerAutoDecimalOptions } from '../types'
import { REGEX_NODE_MODULES, REGEX_SUPPORTED_EXT, REGEX_VUE } from './constant'
import { transformAutoDecimal, transformVueAutoDecimal } from './transform'
import { resolveOptions } from './options'
import { generateDeclaration } from './generate'

export function transform(code: string, id: string, options: InnerAutoDecimalOptions) {
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
export default createUnplugin<AutoDecimalOptions | undefined>((rawOptions) => {
  const filter = createFilter(
    [REGEX_SUPPORTED_EXT, ...REGEX_VUE],
    [REGEX_NODE_MODULES],
  )
  const options = resolveOptions(rawOptions)
  if (options.dts) {
    generateDeclaration(options)
  }
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
