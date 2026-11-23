import type { Node, NodePath } from '@babel/traverse'
import type { BinaryExpression, StringLiteral } from '@babel/types'
import type { MagicStringAST } from 'magic-string-ast'
import type { NewFunctionOptions, Operator } from '../../../types'
import type { Context } from '../../context'
import { isBinaryExpression, isNumericLiteral } from '@babel/types'
import { BASE_COMMENT, LITERALS, OPERATOR_KEYS } from '../../constant'
import { isToDecimalCall } from '../../utils'
import { getComments } from '../comment'
import { DecimalNode } from '../decimal-node'
import { getStaticValue } from './static-value'
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
    const decimalNode = generateDecimalNode(path, node, s, ctx)
    if (decimalNode.integer || decimalNode.invalidNumeric) {
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

function generateDecimalNode(path: NodePath, node: BinaryExpression, s: MagicStringAST, ctx: Context) {
  const decimalNode = new DecimalNode(node.operator as Operator)
  const leftPath = ctx.options.toDecimal && path.isCallExpression()
    ? path.get('callee.object.left')
    : path.get('left')
  const rightPath = ctx.options.toDecimal && path.isCallExpression()
    ? path.get('callee.object.right')
    : path.get('right')
  // 尝试获取节点值
  const leftNode = isBinaryExpression(node.left)
    ? generateDecimalNode(leftPath, node.left, s, ctx)
    : undefined
  const rightNode = isBinaryExpression(node.right)
    ? generateDecimalNode(rightPath, node.right, s, ctx)
    : undefined
  // 尝试获取节点值
  // 若无法解析时，直接使用
  // 若值为非数字（当 supportString 时，可被转为数字的字符串除外），则跳过转换
  if (!leftNode || leftNode.integer) {
    if (ctx.options.tryGetting) {
      decimalNode.leftValue = getStaticValue(path.get('left'), ctx)
      decimalNode.invalidNumeric = isInvalidNumeric(decimalNode.leftValue, ctx)
    }
    decimalNode.left = s.snipNode(node.left).toString()
  }
  else {
    decimalNode.left = leftNode.toString()
  }
  if (!rightNode || rightNode.integer) {
    if (ctx.options.tryGetting) {
      const rightPath = path.get('right')
      if (ctx.options.toDecimal && rightPath.isCallExpression() && isToDecimalCall(rightPath.node.callee, ctx)) {
        decimalNode.rightValue = getStaticValue(rightPath.get('callee.object'), ctx)
      }
      else {
        decimalNode.rightValue = getStaticValue(rightPath, ctx)
      }
      if (!decimalNode.invalidNumeric) {
        decimalNode.invalidNumeric = isInvalidNumeric(decimalNode.rightValue, ctx)
      }
    }
    decimalNode.right = s.snipNode(node.right).toString()
  }
  else {
    decimalNode.right = rightNode.toString()
  }
  decimalNode.leftNode = leftNode
  decimalNode.rightNode = rightNode
  const leftInteger = leftNode?.integer ?? isInteger(decimalNode.leftValue, node.left)
  const rightInteger = rightNode?.integer ?? isInteger(decimalNode.rightValue, node.right)
  decimalNode.integer = leftInteger && rightInteger && node.operator !== '/'
  decimalNode.invalidNumeric = leftNode?.invalidNumeric || rightNode?.invalidNumeric || decimalNode.invalidNumeric
  return decimalNode
}
function isInvalidNumeric(value: unknown, ctx: Context) {
  if (!ctx.options.tryGetting || ctx.internal) {
    return false
  }
  // null 为 import/require 或者无法解析的值，默认视为有效数字，可以进行转换
  if (value === null) {
    return false
  }
  // undefined 为 null 或者 undefined，默认视为无效数字，不能进行转换
  if (value === undefined) {
    return true
  }
  if (ctx.options.supportString) {
    return value === '' || Number.isNaN(Number(value))
  }
  return typeof value !== 'number'
}
function isInteger(value: unknown, node: Node) {
  if (typeof value === 'number') {
    return Number.isInteger(value)
  }
  return isNumericLiteral(node) && Number.isInteger(node.value)
}
