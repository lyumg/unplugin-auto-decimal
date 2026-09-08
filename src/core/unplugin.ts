import type { AutoDecimalOptions } from '../types'
import { createFilter } from '@rollup/pluginutils'
import { isPackageExists } from 'local-pkg'
import { createUnplugin } from 'unplugin'
import { PKG_NAME, REGEX_NODE_MODULES, REGEX_SUPPORTED_EXT, REGEX_VUE } from './constant'
import { Context } from './context'
/*
 * @Date: 2024-12-17 15:43:01
 * @Author: lyumg
 * @FilePath: /unplugin-auto-decimal/src/core/unplugin.ts
 */
export default createUnplugin<AutoDecimalOptions | undefined>((options = {}) => {
  const filter = createFilter(options.includes || [REGEX_SUPPORTED_EXT, REGEX_VUE], options.excludes || [REGEX_NODE_MODULES])
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
      const ctx = new Context(id, options)
      return ctx.transform(code)
    },
  }
})
