import type { Node, NodePath } from '@babel/traverse'
import type { BigRoundingMode, DecimalLightRoundingMode, DecimalRoundingMode, Package, RoundingModes } from '../types'
import { isBinaryExpression, isNumericLiteral, isStringLiteral, isTemplateLiteral } from '@babel/types'
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

export function findScopeBinding(path: NodePath, name: string) {
  const binding = path.scope.hasBinding(name)
  if (!binding) {
    if (!path.scope.path.parentPath) {
      return path.scope.getBinding(name)
    }
    return findScopeBinding(path.scope.path.parentPath, name)
  }
  return path.scope.getBinding(name)!
}

export function findTargetPath(path: NodePath, isTargetFunction: (node: any) => boolean) {
  let loop = true
  let parentPath = path
  while (loop && parentPath) {
    if (isTargetFunction(parentPath.parent)) {
      loop = false
    }
    else {
      parentPath = parentPath.parentPath!
    }
  }
  return parentPath
}

export function isInteger(node: Node) {
  if (isNumericLiteral(node)) {
    const { value } = node
    return !value.toString().includes('.')
  }
  return false
}

export function isStringNode(node?: Node | null) {
  return isStringLiteral(node) || isTemplateLiteral(node)
}
