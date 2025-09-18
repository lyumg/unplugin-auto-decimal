import type { MagicStringAST } from 'magic-string-ast'
import type { AutoDecimalOptions, InnerAutoDecimalOptions } from '../types'
import { createFilter } from '@rollup/pluginutils'
import { isPackageExists } from 'local-pkg'
import { createUnplugin } from 'unplugin'
import { PKG_NAME, REGEX_NODE_MODULES, REGEX_SUPPORTED_EXT, REGEX_VUE } from './constant'
import { generateDeclaration } from './generate'
import { resolveOptions } from './options'
import { transformAutoDecimal, transformVueAutoDecimal } from './transform'

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
      const pkgName = options.package ?? PKG_NAME
      if (!isPackageExists(pkgName)) {
        console.error(`[AutoDecimal] 请先安装 ${pkgName}`)
        return { code }
      }
      return transform(code, id, options)
    },
  }
})
