import type { ParserPlugin } from '@babel/parser'
import type { MagicStringAST } from 'magic-string-ast'
import type { Context } from '../context'
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import { getASTPlugins } from '../ast/helper/ast-plugin'
import { visitAST } from '../ast/visit'
/*
 * @Date: 2026-09-02 16:13:05
 * @Author: lyumg
 * @FilePath: /unplugin-auto-decimal/src/core/transformers/script.ts
 */

export default function transformScript(code: string, s: MagicStringAST, ctx: Context) {
  const plugins: ParserPlugin[] = getASTPlugins(ctx)
  const ast = parse(code, {
    sourceType: 'module',
    plugins,
  })
  // @ts-expect-error adapter cjs/esm
  const walk = traverse.default ?? traverse
  walk(ast, visitAST(s, ctx))
}
