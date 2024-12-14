import type { Node, NodePath } from '@babel/traverse'
import type { BinaryExpression, StringLiteral } from '@babel/types'
import type { MagicStringAST } from 'magic-string-ast'
import { isNumericLiteral } from '@babel/types'
import type { Operator, Options } from '../types'
import { BASE_COMMENT, LITERALS, OPERATOR, OPERATOR_KEYS } from './constant'
import { getComments } from './comment'
import { getTransformed } from './transform'

export function processBinary(options: Options, path: NodePath<BinaryExpression>) {
  const { node } = path
  const { left, operator, right } = node
  if (!OPERATOR_KEYS.includes(operator))
    return
  if (shouldIgnoreComments(path)) {
    path.skip()
    return
  }
  if (isStringSplicing(node, options) || mustTailPatchZero(node, options)) {
    options.shouldSkip = true
    path.skip()
    return
  }
  try {
    // FIXME 当左右都时数字时, 可跳过ast
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
  if (!options.autoDecimalOptions?.tailPatchZero)
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
  const { supportString = false } = options.autoDecimalOptions || {}
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
  return options.initial ? `${generateContent}.toNumber()` : generateContent
}
function extractNodeValue(node: Node, options: Options) {
  const codeSnippet = options.msa.snipNode(node).toString()
  return getTransformed(
    codeSnippet,
    transOptions => ({ BinaryExpression: path => processBinary({ ...transOptions, decimalPkgName: options.decimalPkgName }, path) }),
    options.autoDecimalOptions,
  )
}
function handleBinaryError(error: unknown): never {
  if (error instanceof Error) {
    throw new SyntaxError(`Auto Decimal compile error： ${error.message}`)
  }
  throw error
}
