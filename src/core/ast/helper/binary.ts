import type { Node, NodePath } from '@babel/traverse'
import type { BinaryExpression, StringLiteral } from '@babel/types'
import type { MagicStringAST } from 'magic-string-ast'
import type { NewFunctionOptions, Operator } from '../../../types'
import type { Context } from '../../context'
import { isBinaryExpression, isNumericLiteral } from '@babel/types'
import { BASE_COMMENT, LITERALS, OPERATOR_KEYS } from '../../constant'
import { getComments } from '../comment'
import { DecimalNode } from '../decimal-node'
/*
 * @Date: 2026-09-03 17:20:47
 * @Author: lyumg
 * @FilePath: /unplugin-auto-decimal/src/core/ast/helper/binary.ts
 */
export function processBinaryExpr(s: MagicStringAST, ctx: Context, node: BinaryExpression, path: NodePath) {
  const { operator } = node
  if (!OPERATOR_KEYS.includes(operator))
    return
  if (!ctx.options.toDecimal) {
    if (shouldIgnoreComments(path) || isStringSplicing(node, ctx) || mustTailPatchZero(node, ctx)) {
      path.skip()
      return
    }
  }
  try {
    path.skip()
    const decimalNode = generateDecimalNode(s, node)
    if (decimalNode.integer) {
      return
    }
    s.overwriteNode(node, decimalNode.toString(ctx))
    resolveNeedImport(ctx)
  }
  catch (error) {
    handleBinaryError(error)
  }
  finally {
    // ctx.reset()
  }
}

function mustTailPatchZero(node: BinaryExpression, ctx: Context) {
  if (!ctx.options.tailPatchZero)
    return false
  const { left, operator, right } = node
  if (operator !== '+')
    return false
  if (isNumericLiteral(left) && isNumericLiteral(right))
    return false
  if (!isNumericLiteral(right) || right.value !== 0)
    return true
}
function isStringSplicing(node: BinaryExpression, ctx: Context) {
  const { left, operator, right } = node
  if (operator !== '+')
    return false
  if (isNumericLiteral(left) && isNumericLiteral(right))
    return false
  return [left, right].some(operand => LITERALS.includes(operand.type) && isNonNumericLiteral(operand, ctx))
}
function isNonNumericLiteral(node: Node, ctx: Context) {
  if (!LITERALS.includes(node.type))
    return false
  if (node.type === 'NullLiteral')
    return true
  const { value } = node as StringLiteral
  const { supportString } = ctx.options
  const isString = supportString ? Number.isNaN(Number(value)) : ['StringLiteral', 'TemplateLiteral'].includes(node.type)
  return node.type === 'BooleanLiteral' || isString || value.trim() === ''
}
function shouldIgnoreComments(path: NodePath): boolean {
  const comments = getComments(path)
  return comments?.some(comment => comment.value.includes(BASE_COMMENT))
}
function handleBinaryError(error: unknown): never {
  if (error instanceof Error) {
    throw new SyntaxError(`AutoDecimal compile error： ${error.message}`)
  }
  throw error
}
function resolveNeedImport(ctx: Context) {
  const supportNewFunction = ctx.options.supportNewFunction as NewFunctionOptions
  if (!ctx.internal || (ctx.internal && !supportNewFunction.injectWindow)) {
    ctx.needImport = true
  }
}

function generateDecimalNode(s: MagicStringAST, node: BinaryExpression) {
  const decimalNode = new DecimalNode(node.operator as Operator)
  const leftNode = isBinaryExpression(node.left) ? generateDecimalNode(s, node.left) : undefined
  const rightNode = isBinaryExpression(node.right) ? generateDecimalNode(s, node.right) : undefined
  decimalNode.left = !leftNode || leftNode.integer
    // TODO 尝试获取节点值
    // 若无法解析时，直接使用
    // 若值为非数字（当 supportString 时，可被转为数字的字符串除外），则跳过转换
    ? s.snipNode(node.left).toString()
    : leftNode.toString()
  decimalNode.right = !rightNode || rightNode.integer
    ? s.snipNode(node.right).toString()
    : rightNode.toString()
  decimalNode.leftNode = leftNode
  decimalNode.rightNode = rightNode
  const leftInteger = leftNode?.integer ?? (isNumericLiteral(node.left) && Number.isInteger(node.left.value))
  const rightInteger = rightNode?.integer ?? (isNumericLiteral(node.right) && Number.isInteger(node.right.value))
  decimalNode.integer = leftInteger && rightInteger && node.operator !== '/'
  return decimalNode
}
