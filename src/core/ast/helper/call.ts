import type { NodePath } from '@babel/traverse'
import type { BinaryExpression, CallExpression, Identifier, Node, ObjectExpression, StringLiteral } from '@babel/types'
import type { MagicStringAST } from 'magic-string-ast'
import type { InnerToDecimalOptions } from '../../../types'
import type { Context } from '../../context'
import { generate } from '@babel/generator'
import {
  arrayExpression,
  callExpression,
  identifier,
  isBinaryExpression,
  isIdentifier,
  isNumericLiteral,
  isObjectExpression,
  isObjectProperty,
  isStringLiteral,
  memberExpression,
  numericLiteral,
} from '@babel/types'
import { DEFAULT_TO_DECIMAL_CONFIG } from '../../constant'
import { mergeToDecimalOptions } from '../../options'
import { getPkgName, getRootBinaryExprPath, getRoundingMode, isToDecimalCall } from '../../utils'
import { processBinaryExpr } from './binary'
import { getStaticValue } from './static-value'
/*
 * @Date: 2026-09-03 17:19:25
 * @Author: lyumg
 * @FilePath: /unplugin-auto-decimal/src/core/traverse/helper/call.ts
 */
export function processCallExpr(s: MagicStringAST, ctx: Context, node: CallExpression, path: NodePath<CallExpression | BinaryExpression>) {
  const { toDecimal } = ctx.options
  let toDecimalOptions: InnerToDecimalOptions = { ...DEFAULT_TO_DECIMAL_CONFIG }
  if (toDecimal) {
    toDecimalOptions = mergeToDecimalOptions(toDecimalOptions, toDecimal)
  }
  const { callee } = node
  if (!isToDecimalCall(callee, ctx))
    return
  const { property, object } = callee
  if (!isIdentifier(property) || property.name !== toDecimalOptions.name)
    return

  const isInvalidCallExpr = path.isCallExpression() && !isBinaryExpression(path.parentPath.node) && !isBinaryExpression(object)
  if (isInvalidCallExpr) {
    throw new SyntaxError(`
      line: ${path.parentPath.node.loc?.start.line}, ${s.sliceNode(path.parentPath.node).toString()} 或 ${s.sliceNode(object).toString()} 不是有效的计算表达式  
    `)
  }
  ctx.callCode = `${toDecimalOptions.callMethod}()`
  if (node.arguments.length > 0) {
    // 解析 toDecimal 参数
    const [arg] = node.arguments
    // TODO 还有可能是变量引用
    if (isObjectExpression(arg)) {
      assignDecimalCallExpr(arg, path, ctx, toDecimalOptions)
    }
    else {
      console.error(`line: ${node.loc?.start.line}, to ${node.loc?.start.column} toDecimal 参数错误, 请传入一个对象`)
    }
  }
  else if (toDecimalOptions.callMethod === 'toFixed') {
    ctx.callCode = `${toDecimalOptions.callMethod}(${toDecimalOptions.precision}, ${getRoundingMode(toDecimalOptions.roundingModes, ctx.options.package)})`
  }

  const start = object.end ?? 0
  s.remove(start, node.end ?? 0)
  if (isBinaryExpression(object)) {
    if (object.start !== node.start) {
      s.remove(node.start ?? 0, object.start ?? 0)
    }
    processBinaryExpr(s, ctx, object, path)
    return
  }
  const rootBinaryPath = getRootBinaryExprPath(path)
  if (!rootBinaryPath)
    return
  processBinaryExpr(s, ctx, rootBinaryPath.node, rootBinaryPath)
}
function assignDecimalCallExpr(
  node: ObjectExpression,
  path: NodePath<CallExpression | BinaryExpression>,
  ctx: Context,
  toDecimalOptions: InnerToDecimalOptions,
) {
  const toDecimalArgs: any[] = [
    numericLiteral(toDecimalOptions.precision),
    numericLiteral(getRoundingMode(toDecimalOptions.roundingModes, ctx.options.package)),
  ]
  let callee: Node | null = null
  /**
   * 目前处理 toDecimal 时，支持两种情况
   * 一种为 (xx + xxx).toDecimal() 的形式
   * 一种为 xx + xxx.toDecimal() 的形式
   */
  const fnArgs = path.isCallExpression() ? path.get('arguments.0') : path.get('right.arguments.0')
  const value = getStaticValue(fnArgs)
  node.properties.forEach((prop) => {
    // TODO key 不是 identifier 时，需要处理一下
    // 有可能是 computed property
    if (isObjectProperty(prop) && isIdentifier(prop.key)) {
      if (prop.key.name === 'callMethod' || prop.key.name === 'cm') {
        callee = prop.value
      }
      else if (prop.key.name === 'precision' || prop.key.name === 'p') {
        toDecimalArgs[0] = prop.value
      }
      else if (prop.key.name === 'roundingModes' || prop.key.name === 'rm') {
        // 尝试获取 roundingModes 的值，如果为一个数字或者数字变量的话，直接使用，否则需要以枚举形式调用
        const rm = value ? value.roundingModes || value.rm : null
        toDecimalArgs[1] = isStringLiteral(prop.value)
          ? numericLiteral(getRoundingMode(prop.value.value, ctx.options.package))
          : isNumericLiteral(prop.value) || typeof rm === 'number'
            ? prop.value
            : memberExpression(identifier(getPkgName(ctx)), prop.value as Identifier, true)
      }
    }
  })
  callee = callee ? arrayExpression([callee]) as unknown as Identifier | StringLiteral : identifier(toDecimalOptions.callMethod)
  let callExpr = callExpression(callee, [])
  let isDecimalCall = false
  if (value) {
    if (value.cm || value.callMethod || toDecimalOptions.callMethod) {
      const callMethod = value.cm || value.callMethod || toDecimalOptions.callMethod
      isDecimalCall = callMethod === 'decimal'
      if (callMethod === 'toFixed') {
        callExpr = callExpression(callee, toDecimalArgs)
      }
    }
  }
  else {
    if (toDecimalOptions.callMethod === 'toFixed') {
      callExpr = callExpression(callee, toDecimalArgs)
    }
  }
  const { code } = generate(callExpr, {
    retainLines: false,
    compact: false,
  })
  ctx.callCode = code
  ctx.callDecimal = isDecimalCall
}
