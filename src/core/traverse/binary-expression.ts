import type { Node, NodePath } from '@babel/traverse'
import type { BinaryExpression, StringLiteral } from '@babel/types'
import type { MagicStringAST } from 'magic-string-ast'
import { isNumericLiteral } from '@babel/types'
import type { Extra, Operator, Options } from '../../types'
import { BASE_COMMENT, LITERALS, OPERATOR, OPERATOR_KEYS } from '../constant'
import { getTransformed } from '../transform'
import { getComments } from './comment'

export function resolveBinaryExpression(path: NodePath<BinaryExpression>, options: Options) {
  const extra = (path.node.extra ?? {}) as unknown as Extra
  if (options.autoDecimalOptions.toDecimal && !extra.__shouldTransform)
    return
  if (extra.__shouldTransform) {
    path.node.extra = extra.__extra
    return processBinary(extra.options, path)
  }
  return processBinary({ ...options, initial: true }, path)
}
export function processBinary(options: Options, path: NodePath<BinaryExpression>) {
  const { node } = path
  const { left, operator, right } = node
  if (!OPERATOR_KEYS.includes(operator))
    return
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
  // 两边都是数字时, 直接转换成 Decimal
  if (isNumericLiteral(left) && isNumericLiteral(right) && OPERATOR_KEYS.includes(operator)) {
    const decimalParts: Array<string | number> = [`new ${options.decimalPkgName}(${left.value})`]
    decimalParts.push(`.${OPERATOR[operator as Operator]}(${right.value})`)
    if (options.initial && options.callMethod !== 'decimal') {
      decimalParts.push(`.${options.callMethod}${options.callArgs}`)
    }
    options.msa.overwriteNode(node, decimalParts.join(''))
    path.skip()
    return
  }
  try {
    const leftNode = extractNodeValue(left, options)
    const rightNode = extractNodeValue(right, options)
    if (leftNode.shouldSkip || rightNode.shouldSkip)
      return
    const content = createDecimalOperation(leftNode.msa, rightNode.msa, operator as Operator, options)
    options.msa.overwriteNode(node, content)
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
  let leftContent = `new ${options.decimalPkgName}(${leftAst.toString()})`
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
      BinaryExpression: path => processBinary({
        ...transOptions,
        decimalPkgName: options.decimalPkgName,
      }, path),
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
