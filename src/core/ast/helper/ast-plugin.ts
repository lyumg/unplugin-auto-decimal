/*
 * @Date: 2026-09-05 17:05:46
 * @Author: lyumg
 * @FilePath: /unplugin-auto-decimal/src/core/ast/helper/ast-plugin.ts
 */
import type { ParserPlugin } from '@babel/parser'
import type { Context } from '../../context'

export function getASTPlugins(ctx: Context) {
  const plugins: ParserPlugin[] = []
  if (/^\.[jt]sx/.test(ctx.ext)) {
    plugins.push('jsx')
  }
  if (ctx.options.dts || ctx.ext.startsWith('.ts')) {
    plugins.push('typescript')
    if (ctx.options.decorator) {
      plugins.push('decorators')
    }
  }
  return plugins
}
