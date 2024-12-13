import type { Node, NodePath } from 'babel__traverse'
import type { BinaryExpression, StringLiteral } from '@babel/types'
import type { MagicStringAST } from 'magic-string-ast'
import type { Operator, Options } from '../types'
import { BASE_COMMENT, LITERALS, OPERATOR, OPERATOR_KEYS } from './constant'
import { getComments } from './comment'
import { getTransformed } from './transform'

export function processBinary(options: Options, path: NodePath<BinaryExpression>, decimalPkgName: string) {
  const { node } = path
  const { left, operator, right } = node
  if (!OPERATOR_KEYS.includes(operator))
    return
  if (shouldIgnoreComments(path)) {
    path.skip()
    return
  }
  if (isStringSplicing(node, options)) {
    options.shouldSkip = true
    path.skip()
    return
  }
  try {
    const leftNode = extractNodeValue(left, options, decimalPkgName)
    const rightNode = extractNodeValue(right, options, decimalPkgName)
    if (leftNode.shouldSkip || rightNode.shouldSkip)
      return
    const content = createDecimalOperation(leftNode.msa, rightNode.msa, decimalPkgName, operator as Operator, options.topLevel)
    options.msa.overwriteNode(node, content)
    path.skip()
  }
  catch (error) {
    handleBinaryError(error)
  }
}

function isStringSplicing(node: BinaryExpression, options: Options) {
  const { left, operator, right } = node
  if (operator !== '+')
    return false
  return [left, right].some(operand => LITERALS.includes(operand.type) && isNonNumericLiteral(operand, options))
}
function isNonNumericLiteral(node: Node, options: Options) {
  if (!LITERALS.includes(node.type))
    return false
  if (node.type === 'NullLiteral')
    return true
  const { value } = node as StringLiteral
  const { supportString = true } = options.autoDecimalOptions || {}
  const isString = supportString ? Number.isNaN(Number(value)) : node.type === 'StringLiteral'
  return node.type === 'BooleanLiteral' || isString || value.trim() === ''
}
function shouldIgnoreComments(path: NodePath<BinaryExpression>): boolean {
  const comments = getComments(path)
  return comments?.some(comment => comment.value.includes(BASE_COMMENT))
}
function createDecimalOperation(leftAst: MagicStringAST, rightAst: MagicStringAST, decimalPkgName: string, operator: Operator, topLevel?: boolean): string {
  let leftContent = `new ${decimalPkgName}(${leftAst.toString()})`
  if (leftAst.hasChanged()) {
    leftContent = `${leftAst.toString()}`
  }
  const generateContent = `${leftContent}.${OPERATOR[operator]}(${rightAst.toString()})`
  return topLevel ? `${generateContent}.toNumber()` : generateContent
}
function extractNodeValue(node: Node, options: Options, pkgName: string) {
  const codeSnippet = options.msa.snipNode(node).toString()
  return getTransformed(
    codeSnippet,
    transOptions => ({ BinaryExpression: path => processBinary(transOptions, path, pkgName) }),
    options.autoDecimalOptions,
  )
}
function handleBinaryError(error: unknown): never {
  if (error instanceof Error) {
    throw new SyntaxError(`Auto Decimal compile error： ${error.message}`)
  }
  throw error
}
