import type { Binding, Node, NodePath } from '@babel/traverse'
import type { Identifier, MemberExpression } from '@babel/types'
import type { BigRoundingMode, DecimalLightRoundingMode, DecimalRoundingMode, Options, Package, RoundingModes } from '../types'
import { isArrowFunctionExpression, isBinaryExpression, isCallExpression, isFunctionDeclaration, isFunctionExpression, isIdentifier, isImportDefaultSpecifier, isImportNamespaceSpecifier, isImportSpecifier, isLiteral, isMemberExpression, isNumericLiteral, isStringLiteral, isTemplateLiteral, isVariableDeclarator } from '@babel/types'
import { BIG_RM, DECIMAL_RM, DECIMAL_RM_LIGHT } from './constant'

export function getRoundingMode(mode: RoundingModes | number, packageName: Package) {
  if (typeof mode === 'number') {
    return mode
  }
  if (packageName === 'big.js') {
    return BIG_RM[mode as BigRoundingMode]
  }
  if (packageName === 'decimal.js') {
    return DECIMAL_RM[mode as DecimalRoundingMode]
  }
  return DECIMAL_RM_LIGHT[mode as DecimalLightRoundingMode]
}
export function getRootBinaryExprPath(path: NodePath) {
  let parentPath = path.parentPath
  let binaryPath = path
  let loop = true
  while (loop && parentPath) {
    if (isBinaryExpression(parentPath.node)) {
      binaryPath = parentPath
      parentPath = parentPath.parentPath
    }
    else {
      loop = false
    }
  }
  return binaryPath
}
export function getScopeBinding(path: NodePath | null, name?: string | MemberExpression) {
  if (!path || !name)
    return
  if (typeof name !== 'string') {
    name = getObjectIdentifierName(name)
  }
  const binding = path.scope.hasBinding(name)
  if (!binding) {
    if (!path.scope.path.parentPath) {
      return path.scope.getBinding(name)
    }
    return getScopeBinding(path.scope.path.parentPath, name)
  }
  return path.scope.getBinding(name)!
}
export function getTargetPath<T extends Node = Node>(path: NodePath, isTargetFunction: ((node?: Node | null) => boolean)): NodePath<T> | null {
  let loop = true
  let parentPath: NodePath | null = path
  while (loop && parentPath) {
    if (isTargetFunction(parentPath?.parent)) {
      loop = false
    }
    else {
      parentPath = parentPath.parentPath
    }
  }
  return parentPath?.parentPath as NodePath<T> | null
}
export function isIntegerValue(node: Node, path: NodePath, options: Options) {
  if (options.autoDecimalOptions.toDecimal) {
    return false
  }
  return isNumeric(node, path, options, true)
}
export function isNumberValue(node: Node, path: NodePath, options: Options) {
  return isNumeric(node, path, options, false)
}
export function isStringNode(node?: Node | null) {
  return isStringLiteral(node) || isTemplateLiteral(node)
}
export function isFunctionNode(node?: Node | null) {
  return isArrowFunctionExpression(node) || isFunctionExpression(node) || isFunctionDeclaration(node)
}
export function isImportNode(node?: Node | null) {
  return isImportNamespaceSpecifier(node) || isImportDefaultSpecifier(node) || isImportSpecifier(node)
}
export function getFunctionName(path: NodePath) {
  if (isFunctionDeclaration(path.node)) {
    return path.node.id?.name
  }
  if (isArrowFunctionExpression(path.node) || isFunctionExpression(path.node)) {
    const node = path.parent
    if (isVariableDeclarator(node)) {
      return (node.id as Identifier).name
    }
  }
}
export function getPkgName(options: Options) {
  if (options.fromNewFunction) {
    const { supportNewFunction } = options.autoDecimalOptions
    if (typeof supportNewFunction !== 'boolean' && supportNewFunction.injectWindow) {
      return `window.${supportNewFunction.injectWindow}`
    }
  }
  return options.decimalPkgName
}

export function getNodeValue(node: Node, path: NodePath, options: Options, isInteger?: boolean) {
  // TIPS 跳过导入的变量和函数调用
  if (isFunctionNode(node) || isImportNode(node) || isCallExpression(node)) {
    return
  }
  if (isLiteral(node)) {
    return getLiteralValue(node, path, options)
  }
  const ownerPath = options.ownerPath ?? path
  let parentPath: NodePath | null = ownerPath
  let binding: Binding | undefined
  const name = isIdentifier(node) ? node.name : isMemberExpression(node) ? getObjectIdentifierName(node) : ''
  while (!binding && parentPath) {
    binding = getScopeBinding(parentPath, name)
    parentPath = parentPath.parentPath
  }
  if (!binding) {
    return
  }
  if (!isVariableDeclarator(binding.path.node)) {
    return
  }
  const { init } = binding.path.node
  if (isCallExpression(init)) {
    return
  }
  if (isLiteral(init)) {
    return getLiteralValue(init, binding.path, options)
  }
  if (isIdentifier(init)) {
    return getNodeValue(init, binding.path, options, isInteger)
  }
}
function isNumeric(node: Node, path: NodePath, options: Options, isInteger = false): boolean {
  const value = getNodeValue(node, path, options, isInteger)
  if (typeof value === 'undefined') {
    return false
  }
  const isNotNumber = Number.isNaN(Number(value))
  if (isNotNumber || typeof value === 'string') {
    return false
  }
  return isInteger ? !value.toString().includes('.') : true
}
function getObjectIdentifierName(node: MemberExpression) {
  if (isMemberExpression(node.object)) {
    return getObjectIdentifierName(node.object)
  }
  if (isIdentifier(node.object)) {
    return node.object.name
  }
  return ''
}
function getLiteralValue(node: Node, path: NodePath, options: Options, isInteger?: boolean) {
  if (isNumericLiteral(node)) {
    return node.value
  }
  if (!options.autoDecimalOptions.supportString) {
    return
  }
  if (isStringLiteral(node)) {
    return node.value
  }
  if (isTemplateLiteral(node)) {
    const { quasis, expressions } = node
    if (!expressions.length) {
      return quasis.map(item => item.value.raw).join('')
    }
    const quasisCopy = quasis.slice(1, -1)
    let index = 0
    const exprList: any[] = []
    expressions.forEach((expr) => {
      if (quasisCopy.length) {
        const quasisItem = quasisCopy[index]
        const start = quasisItem.loc!.start
        const exprStart = expr.loc!.start
        if (start.line < exprStart.line || (start.line === exprStart.line && start.column <= exprStart.column)) {
          exprList.push(quasisItem.value.raw)
          index++
        }
      }
      exprList.push(getNodeValue(expr, path, options, isInteger))
    })
    if (index < quasisCopy.length - 1) {
      const remainingQuasis = quasisCopy.slice(index)
      remainingQuasis.forEach(item => exprList.push(item.value.raw))
    }
    exprList.unshift(quasis[0].value.raw)
    exprList.push(quasis[quasis.length - 1].value.raw)
    return exprList.join('')
  }
}
