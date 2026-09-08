import type { NodePath } from '@babel/traverse'
import type { BinaryExpression } from '@babel/types'
import type { MagicStringAST } from 'magic-string-ast'
import type { Context } from '../context'
import { isCallExpression } from '@babel/types'
import { isToDecimalCall } from '../utils'
import { processBinaryExpr } from './helper/binary'
import { processCallExpr } from './helper/call'
/*
 * @Date: 2026-09-03 09:06:13
 * @Author: lyumg
 * @FilePath: /unplugin-auto-decimal/src/core/ast/binary-expr.ts
 */
export function resolveBinaryExpression(path: NodePath<BinaryExpression>, s: MagicStringAST, ctx: Context) {
  if (ctx.options.toDecimal) {
    const { right } = path.node
    if (isCallExpression(right) && isToDecimalCall(right.callee, ctx)) {
      processCallExpr(s, ctx, right, path)
    }
    return
  }
  processBinaryExpr(s, ctx, path.node, path)
}
