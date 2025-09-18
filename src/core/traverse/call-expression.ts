import type { NodePath } from '@babel/traverse'
import type { BinaryExpression, CallExpression, NewExpression } from '@babel/types'
import type { InnerToDecimalOptions, Options } from '../../types'
import { isBinaryExpression, isIdentifier, isMemberExpression, isObjectExpression } from '@babel/types'
import { processBinary, resolveNewFunctionExpression } from '.'
import { DEFAULT_TO_DECIMAL_CONFIG } from '../constant'
import { mergeToDecimalOptions } from '../options'
import { findRootBinaryExprPath, getRoundingMode } from '../utils'

export function resolveCallExpression(path: NodePath<CallExpression>, options: Options) {
  const { autoDecimalOptions } = options
  const { toDecimal, supportNewFunction } = autoDecimalOptions
  if (!toDecimal && !supportNewFunction)
    return
  const { node } = path
  const { callee, arguments: args } = node
  if (supportNewFunction && isIdentifier(callee) && callee.name === 'Function') {
    resolveNewFunctionExpression(path as unknown as NodePath<NewExpression>, options)
    return
  }
  if (!isMemberExpression(callee))
    return
  const toDecimalOptions: InnerToDecimalOptions = { ...DEFAULT_TO_DECIMAL_CONFIG }
  if (toDecimal) {
    mergeToDecimalOptions(toDecimalOptions, toDecimal)
  }
  const { property, object } = callee
  if (!isIdentifier(property) || property.name !== toDecimalOptions.name)
    return
  if (!isBinaryExpression(path.parentPath.node) && !isBinaryExpression(object)) {
    throw new SyntaxError(`
      line: ${path.parentPath.node.loc?.start.line}, ${options.msa.sliceNode(path.parentPath.node).toString()} 或 ${options.msa.sliceNode(object).toString()} 不是有效的计算表达式  
    `)
  }
  if (args && args.length > 0) {
    const [arg] = args
    if (!isObjectExpression(arg)) {
      throw new TypeError('toDecimal 参数错误')
    }
    const rawArg = options.msa.snipNode(arg).toString()
    const jsonArg = rawArg.replace(/(\w+):/g, '"$1":').replace(/'/g, '"')
    try {
      const argToDecimalOptions = JSON.parse(jsonArg)
      mergeToDecimalOptions(toDecimalOptions, argToDecimalOptions)
    }
    catch (e: unknown) {
      console.error(e)
    }
  }
  let callArgs = '()'
  if (toDecimalOptions.callMethod === 'toFixed') {
    callArgs = `(${toDecimalOptions.precision}, ${getRoundingMode(toDecimalOptions.roundingModes, autoDecimalOptions.package)})`
  }
  const start = object.end ?? 0
  options.msa.remove(start, node.end ?? 0)
  const resolveBinaryOptions = {
    ...options,
    initial: true,
    callArgs,
    callMethod: toDecimalOptions.callMethod,
  }
  if (isBinaryExpression(object)) {
    if (object.start !== node.start) {
      options.msa.remove(node.start ?? 0, object.start ?? 0)
    }
    object.extra = {
      ...object.extra,
      __extra: object.extra,
      options: resolveBinaryOptions,
      __shouldTransform: true,
    }
    return
  }
  const rootPath = findRootBinaryExprPath(path)
  const runtimeOptions = {} as Options
  processBinary(Object.assign(runtimeOptions, resolveBinaryOptions), rootPath as NodePath<BinaryExpression>)
  Object.assign(options, { needImport: runtimeOptions.needImport })
}
