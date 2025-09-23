import type { Node, NodePath } from '@babel/traverse'
import type { BinaryExpression, StringLiteral } from '@babel/types'
import type { MagicStringAST } from 'magic-string-ast'
import type { Extra, NewFunctionOptions, Operator, Options } from '../../types'
import { isNumericLiteral } from '@babel/types'
import { BASE_COMMENT, LITERALS, OPERATOR, OPERATOR_KEYS } from '../constant'
import { getTransformed } from '../transform'
import { getPkgName, isInteger } from '../utils'
import { getComments } from './comment'

export function resolveBinaryExpression(path: NodePath<BinaryExpression>, options: Options) {
  const extra = (path.node.extra ?? {}) as unknown as Extra
  const runtimeOptions = {} as Options
  if (options.autoDecimalOptions.toDecimal && !extra.__shouldTransform)
    return
  if (extra.__shouldTransform) {
    path.node.extra = extra.__extra
    processBinary(Object.assign(runtimeOptions, extra.options), path)
    Object.assign(options, { needImport: runtimeOptions.needImport })
    return
  }
  processBinary(Object.assign(runtimeOptions, options, { initial: true }), path)
  Object.assign(options, { needImport: runtimeOptions.needImport })
}
export function processBinary(options: Options, path: NodePath<BinaryExpression>) {
  const { node } = path
  const { left, operator, right } = node
  if (!OPERATOR_KEYS.includes(operator))
    return
  if (options.integer) {
    return
  }
  if (!options.autoDecimalOptions.toDecimal) {
    if (shouldIgnoreComments(path)) {
      path.skip()
      return
    }
    if (isStringSplicing(node, options) || mustTailPatchZero(node, options)) {
      options.shouldSkip = true
      path.skip()
      return
    }
  }
  // 如果都是整数则跳过
  if (isInteger(left, options) && isInteger(right, options)) {
    options.integer = true
    return
  }
  // 两边都是数字时, 直接转换成 Decimal
  if (isNumericLiteral(left) && isNumericLiteral(right)) {
    const decimalParts: Array<string | number> = [`new ${getPkgName(options)}(${left.value})`]
    decimalParts.push(`.${OPERATOR[operator as Operator]}(${right.value})`)
    if (options.initial && options.callMethod !== 'decimal') {
      decimalParts.push(`.${options.callMethod}${options.callArgs}`)
    }
    options.msa.overwriteNode(node, decimalParts.join(''))
    resolveNeedImport(options)
    path.skip()
    return
  }
  try {
    const leftNode = extractNodeValue(left, options)
    const rightNode = extractNodeValue(right, options)
    const leftIsInteger = leftNode.integer || isInteger(left, options)
    const rightIsInteger = rightNode.integer || isInteger(right, options)
    if (leftIsInteger && rightIsInteger) {
      return
    }
    if (leftNode.shouldSkip || rightNode.shouldSkip)
      return
    const content = createDecimalOperation(leftNode.msa, rightNode.msa, operator as Operator, options)
    options.msa.overwriteNode(node, content)
    resolveNeedImport(options)
    path.skip()
  }
  catch (error) {
    handleBinaryError(error)
  }
}

function mustTailPatchZero(node: BinaryExpression, options: Options) {
  const { left, operator, right } = node
  if (operator !== '+')
    return false
  if (isNumericLiteral(left) && isNumericLiteral(right))
    return false
  if (!options.autoDecimalOptions.tailPatchZero)
    return false
  if (options.initial && (!isNumericLiteral(right) || right.value !== 0))
    return true
}
function isStringSplicing(node: BinaryExpression, options: Options) {
  const { left, operator, right } = node
  if (operator !== '+')
    return false
  if (isNumericLiteral(left) && isNumericLiteral(right))
    return false
  return [left, right].some(operand => LITERALS.includes(operand.type) && isNonNumericLiteral(operand, options))
}
function isNonNumericLiteral(node: Node, options: Options) {
  if (!LITERALS.includes(node.type))
    return false
  if (node.type === 'NullLiteral')
    return true
  const { value } = node as StringLiteral
  const { supportString } = options.autoDecimalOptions
  const isString = supportString ? Number.isNaN(Number(value)) : ['StringLiteral', 'TemplateLiteral'].includes(node.type)
  return node.type === 'BooleanLiteral' || isString || value.trim() === ''
}
function shouldIgnoreComments(path: NodePath<BinaryExpression>): boolean {
  const comments = getComments(path)
  return comments?.some(comment => comment.value.includes(BASE_COMMENT))
}
function createDecimalOperation(leftAst: MagicStringAST, rightAst: MagicStringAST, operator: Operator, options: Options): string {
  let leftContent = `new ${getPkgName(options)}(${leftAst.toString()})`
  if (leftAst.hasChanged()) {
    leftContent = `${leftAst.toString()}`
  }
  const generateContent = `${leftContent}.${OPERATOR[operator]}(${rightAst.toString()})`
  if (options.initial && options.callMethod !== 'decimal') {
    return `${generateContent}.${options.callMethod}${options.callArgs}`
  }
  return generateContent
}
function extractNodeValue(node: Node, options: Options) {
  const codeSnippet = options.msa.snipNode(node).toString()
  return getTransformed(
    codeSnippet,
    transOptions => ({
      BinaryExpression: path => processBinary(Object.assign(transOptions, {
        decimalPkgName: options.decimalPkgName,
        integer: options.integer,
        fromNewFunction: options.fromNewFunction,
        needImport: options.needImport,
      }), path),
    }),
    options.autoDecimalOptions,
  )
}
function handleBinaryError(error: unknown): never {
  if (error instanceof Error) {
    throw new SyntaxError(`AutoDecimal compile error： ${error.message}`)
  }
  throw error
}
function resolveNeedImport(options: Options) {
  const supportNewFunction = options.autoDecimalOptions.supportNewFunction as NewFunctionOptions
  if (!options.fromNewFunction || (options.fromNewFunction && !supportNewFunction.injectWindow)) {
    options.needImport = true
  }
}
