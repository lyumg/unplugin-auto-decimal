import type { NodePath } from '@babel/traverse'
import type { CallExpression, NewExpression } from '@babel/types'
import type { MagicStringAST } from 'magic-string-ast'
import type { Context } from '../context'
import { isIdentifier } from '@babel/types'
import { processCallExpr } from './helper/call'
import { resolveNewFunctionExpression } from './new-fn'
/*
 * @Date: 2026-09-03 14:23:17
 * @Author: lyumg
 * @FilePath: /unplugin-auto-decimal/src/core/ast/call-expr.ts
 */
export function resolveCallExpression(path: NodePath<CallExpression>, s: MagicStringAST, ctx: Context) {
  const { toDecimal, supportNewFunction } = ctx.options
  if (!toDecimal && !supportNewFunction)
    return
  const { node } = path
  const { callee } = node
  if (supportNewFunction && isIdentifier(callee) && callee.name === 'Function') {
    resolveNewFunctionExpression(path as unknown as NodePath<NewExpression>, s, ctx)
    return
  }
  processCallExpr(s, ctx, node, path)
}
