import type { Node, NodePath } from '@babel/traverse'
import type { Identifier, MemberExpression } from '@babel/types'
import type { BigRoundingMode, DecimalLightRoundingMode, DecimalRoundingMode, Options, Package, RoundingModes } from '../types'
import { isArrowFunctionExpression, isBinaryExpression, isFunctionDeclaration, isFunctionExpression, isIdentifier, isImportDefaultSpecifier, isImportNamespaceSpecifier, isImportSpecifier, isMemberExpression, isNumericLiteral, isStringLiteral, isTemplateLiteral, isVariableDeclarator } from '@babel/types'
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
export function findRootBinaryExprPath(path: NodePath) {
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
export function findScopeBinding(path: NodePath | null, name?: string | MemberExpression) {
  if (!path || !name)
    return
  if (typeof name !== 'string') {
    name = getObjectIdentifier(name)
  }
  const binding = path.scope.hasBinding(name)
  if (!binding) {
    if (!path.scope.path.parentPath) {
      return path.scope.getBinding(name)
    }
    return findScopeBinding(path.scope.path.parentPath, name)
  }
  return path.scope.getBinding(name)!
}
export function findTargetPath<T extends Node = Node>(path: NodePath, isTargetFunction: ((node?: Node | null) => boolean)): NodePath<T> | null {
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
export function isNumber(node: Node, options: Options, isInteger = false) {
  if (isNumericLiteral(node)) {
    if (isInteger) {
      const { value } = node
      return !value.toString().includes('.')
    }
    return true
  }
  if (options.autoDecimalOptions.supportString && isStringNode(node)) {
    if (isTemplateLiteral(node)) {
      const { quasis, expressions } = node
      const isEmpty = quasis.every(item => item.value.raw === '')
      const isStringNumber = quasis.every((item) => {
        const value = item.value.raw
        const isNumber = !Number.isNaN(Number(value))
        if (isInteger) {
          if (isNumber) {
            return !value.includes('.')
          }
          return false
        }
        return isNumber
      })
      // TODO 不检测模板字符串中的变量是否为数字，包含变量则 false
      const canTransNumberNodes = expressions.length === 0
      return !isEmpty && isStringNumber && canTransNumberNodes
    }
    const { value } = node
    const isNumber = !Number.isNaN(Number(value))
    if (isInteger) {
      if (isNumber) {
        return !value.includes('.')
      }
      return false
    }
    return isNumber
  }
  return false
}
export function isInteger(node: Node, options: Options) {
  return isNumber(node, options, true)
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
function getObjectIdentifier(node: MemberExpression) {
  if (isMemberExpression(node.object)) {
    return getObjectIdentifier(node.object)
  }
  if (isIdentifier(node.object)) {
    return node.object.name
  }
  return ''
}
