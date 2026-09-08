import type { Node, NodePath } from '@babel/traverse'
import type { BinaryExpression, Identifier, MemberExpression } from '@babel/types'
import type {
  BigRoundingMode,
  DecimalLightRoundingMode,
  DecimalRoundingMode,
  Package,
  RoundingModes,
} from '../types'
import type { Context } from './context'
import {
  isArrowFunctionExpression,
  isBinaryExpression,
  isFunctionDeclaration,
  isFunctionExpression,
  isIdentifier,
  isMemberExpression,
  isStringLiteral,
  isTemplateLiteral,
  isVariableDeclarator,
} from '@babel/types'
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
export function getRootBinaryExprPath(path: NodePath): NodePath<BinaryExpression> | null {
  let current: NodePath | null = path
  while (current.parentPath && isBinaryExpression(current.parentPath.node)) {
    current = current.parentPath
  }
  return current as NodePath<BinaryExpression> | null
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
  let parentPath: NodePath | null = path
  while (parentPath && !isTargetFunction(parentPath.parent)) {
    parentPath = parentPath.parentPath
  }
  return parentPath?.parentPath as NodePath<T> | null
}
export function isStringNode(node?: Node | null) {
  return isStringLiteral(node) || isTemplateLiteral(node)
}
export function isFunctionNode(node?: Node | null) {
  return isArrowFunctionExpression(node) || isFunctionExpression(node) || isFunctionDeclaration(node)
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
export function getPkgName(ctx: Context) {
  if (ctx.internal && ctx.options.supportNewFunction) {
    const { supportNewFunction } = ctx.options
    if (typeof supportNewFunction !== 'boolean' && supportNewFunction.injectWindow) {
      return `window.${supportNewFunction.injectWindow}`
    }
  }
  return ctx.decimalPkgName
}

export function isToDecimalCall(callee: Node, ctx: Context): callee is MemberExpression {
  if (!isMemberExpression(callee)) {
    return false
  }
  const { property } = callee
  return isIdentifier(property) && property.name === ctx.options.toDecimal.name
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
