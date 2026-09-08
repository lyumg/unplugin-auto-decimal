import type { Binding, NodePath } from '@babel/traverse'
import type {
  ArrowFunctionExpression,
  AssignmentExpression,
  Expression,
  FunctionDeclaration,
  FunctionExpression,
  Identifier,
  NewExpression,
  Node,
  StringLiteral,
  TemplateLiteral,
} from '@babel/types'
import type { NewFunctionOptions, ToDecimalOptions } from '../../types'
import type { Context } from '../context'
import {
  isArrayExpression,
  isAssignmentExpression,
  isCallExpression,
  isIdentifier,
  isMemberExpression,
  isNodesEquivalent,
  isNumericLiteral,
  isObjectProperty,
  isReturnStatement,
  isStatement,
  isStringLiteral,
  isVariableDeclarator,
} from '@babel/types'
import { MagicStringAST } from 'magic-string-ast'
import { RETURN_DECLARATION_CODE, RETURN_DECLARATION_FN, RETURN_DECLARATION_PREFIX } from '../constant'
import transformScript from '../transformers/script'
import { getFunctionName, getScopeBinding, getTargetPath, isFunctionNode, isStringNode } from '../utils'

export function resolveNewFunctionExpression(path: NodePath<NewExpression>, s: MagicStringAST, ctx: Context) {
  if (!ctx.options.supportNewFunction)
    return
  const { node } = path
  const { callee, arguments: args } = node
  if (!isIdentifier(callee) || callee.name !== 'Function')
    return
  if (args.length === 0)
    return
  const lastArg = args[args.length - 1]
  ctx.internal = true
  resolveReturnParam(path, lastArg, s, ctx)
  const { injectWindow } = ctx.options.supportNewFunction as NewFunctionOptions
  if (!injectWindow) {
    provideDecimal(path, lastArg as Expression, s, ctx)
  }
  ctx.internal = false
}

/**
 * 处理 new Function return 参数
 * 目前仅支持字符串形式、变量、函数调用的方式传递 return 参数
 * 1. new Function('a', 'b', 'return a + b')
 * 2. const assignment = 'a + b';
 * new Function('a', 'b', assignment)
 * 3. const arrowFunc = () => 'a + b';
 * const assignmentFunc = function() {
 *  something ............
 *  return 'a + b'
 * }
 * function func() {
 *  something ............
 *  return 'a + b'
 * }
 * new Function('a', 'b', arrowFunc / assignmentFunc / func)
 */
function resolveReturnParam(path: NodePath, node: Node, s: MagicStringAST, ctx: Context) {
  if (isStringNode(node)) {
    return resolveStringTemplateLiteral(node, s, ctx)
  }
  if (isIdentifier(node) || (isCallExpression(node) && isIdentifier(node.callee))) {
    const name = isIdentifier(node) ? node.name : (node.callee as Identifier).name
    const binding = getScopeBinding(path, name)
    resolveVariableParam(s, ctx, binding, name)
  }
}

function resolveVariableParam(s: MagicStringAST, ctx: Context, binding?: Binding, name?: string) {
  if (!binding)
    return
  if (binding.kind === 'param') {
    resolveVariableOfParam(s, ctx, binding, name)
  }
  const { constantViolations, path } = binding
  if (isVariableDeclarator(path.node)) {
    const { init } = path.node
    if (!init)
      return
    resolveAssignmentExpression(path, init, s, ctx)
  }
  constantViolations.forEach((cv) => {
    if (isAssignmentExpression(cv.node)) {
      const { right } = cv.node
      resolveAssignmentExpression(cv, right, s, ctx)
    }
  })
}

function resolveAssignmentExpression(path: NodePath, node: Expression, s: MagicStringAST, ctx: Context) {
  if (isStringNode(node)) {
    return resolveStringTemplateLiteral(node, s, ctx)
  }
  if (isFunctionNode(node)) {
    return resolveFunction(node, s, ctx)
  }
  if (isIdentifier(node)) {
    const binding = getScopeBinding(path, node.name)
    return resolveVariableParam(s, ctx, binding)
  }
  if (isCallExpression(node)) {
    const variableName = (node.callee as Identifier).name
    const binding = getScopeBinding(path, variableName)
    if (!binding)
      return
    const pathNode = binding.path.node
    if (isFunctionNode(pathNode)) {
      resolveFunction(pathNode, s, ctx)
      return
    }
    if (isVariableDeclarator(pathNode) && isFunctionNode(pathNode.init)) {
      resolveFunction(pathNode.init, s, ctx)
      return
    }
    console.warn(`未处理的节点，line: ${node.loc!.start.line}, ${node.loc!.end.index}; column: ${node.loc!.start.column}, ${node.loc!.end.column}`)
  }
}
// 解析参数形式的变量
function resolveVariableOfParam(s: MagicStringAST, ctx: Context, binding: Binding, name?: string) {
  if (!isFunctionNode(binding.scope.block) || !name) {
    return
  }
  const { block, path } = binding.scope
  const { params } = block
  if (!params.length)
    return
  const paramsIndex = params.findIndex(param => (param as Identifier).name === name)
  if (paramsIndex < 0)
    return
  const fnName = getFunctionName(path)
  if (!fnName || !path.parentPath)
    return
  const parentBinding = getScopeBinding(path.parentPath, fnName)
  if (!parentBinding)
    return
  parentBinding.referencePaths.forEach((nodePath) => {
    if (!isCallExpression(nodePath.parent))
      return
    const targetParams = nodePath.parent.arguments[paramsIndex]
    if (!targetParams)
      return
    resolveReturnParam(nodePath, targetParams, s, ctx)
  })
}

function provideDecimal(path: NodePath, node: Expression, s: MagicStringAST, ctx: Context) {
  if (!s.hasChanged())
    return
  let parentPath: null | NodePath = path.parentPath
  let params: string | number
  // Decimal 形参
  const decimalParamsContent = `'${ctx.decimalPkgName}', ${s.snipNode(node)}`
  const { parent } = path
  let callName = ''
  if (isCallExpression(parent)) {
    s.update(node.start!, node.end!, decimalParamsContent)
    s.update(parent.end! - 1, parent.end!, `, ${ctx.decimalPkgName})`)
    return
  }
  if (isAssignmentExpression(parent)) {
    const { left } = parent
    if (isIdentifier(left)) {
      callName = left.name
    }
    // 如果为 obj.x.x.x or arr[x][x][x] 形式调用
    else if (isMemberExpression(left)) {
      const binding = getScopeBinding(parentPath, left)
      if (!binding)
        return
      binding.referencePaths.forEach((reference) => {
        const referenceParent = reference.parentPath!.parent
        if (isCallExpression(referenceParent)) {
          s.update(referenceParent.end! - 1, referenceParent.end!, `, ${ctx.decimalPkgName})`)
          return
        }
        if (isAssignmentExpression(referenceParent)) {
          const { right } = referenceParent
          if (isNodesEquivalent(right, path.node)) {
            s.update(node.start!, node.end!, decimalParamsContent)
          }
          return
        }
        if (isMemberExpression(referenceParent)) {
          const targetPath = getTargetPath(reference, isCallExpression)
          if (targetPath) {
            s.update(targetPath.node.end! - 1, targetPath.node.end!, `, ${ctx.decimalPkgName})`)
          }
          else {
            const targetPath = getTargetPath(reference, isAssignmentExpression)
            if (!targetPath)
              return
            const { right } = targetPath.node as AssignmentExpression
            if (isNodesEquivalent(right, path.node)) {
              s.update(node.start!, node.end!, decimalParamsContent)
            }
          }
        }
      })
      return
    }
  }
  else if (!isVariableDeclarator(parent)) {
    parentPath = getTargetPath(path, isVariableDeclarator)
    if (!parentPath)
      return
    // TODO MemberExpression 目前不支持变量引用 [variable] 形式调用
    if (isArrayExpression(parent)) {
      params = path.key!
    }
    else if (isObjectProperty(parent)) {
      params = (parent.key as Identifier).name
    }
  }
  if (!callName) {
    if (!parentPath || !isVariableDeclarator(parentPath.node)) {
      return
    }
    callName = (parentPath.node.id as Identifier)?.name
    if (!callName)
      return
  }
  const binding = getScopeBinding(path, callName)
  if (!binding?.referenced)
    return
  s.update(node.start!, node.end!, decimalParamsContent)
  binding.referencePaths.forEach((referencePath) => {
    const { parent } = referencePath
    if (isCallExpression(parent)) {
      s.update(parent.end! - 1, parent.end!, `, ${ctx.decimalPkgName})`)
      return
    }
    if (isMemberExpression(parent)) {
      if (isNumericLiteral(parent.property) || isIdentifier(parent.property)) {
        const targetParams = isNumericLiteral(parent.property) ? parent.property.value : parent.property.name
        if (targetParams !== params) {
          return
        }
        const targetPath = getTargetPath(referencePath, isCallExpression)
        if (!targetPath)
          return
        s.update(targetPath.node.end! - 1, targetPath.node.end!, `, ${ctx.decimalPkgName})`)
      }
    }
  })
}

function resolveStringTemplateLiteral(node: StringLiteral | TemplateLiteral, s: MagicStringAST, ctx: Context) {
  let rawString = ''
  let quote = '\''
  if (isStringLiteral(node)) {
    rawString = node.value
  }
  else {
    quote = '`'
    rawString = s.snipNode(node).toString().slice(1, -1)
  }
  const supportNewFunction = ctx.options.supportNewFunction as NewFunctionOptions
  const code = RETURN_DECLARATION_FN.replace(RETURN_DECLARATION_CODE, rawString)
  const toDecimalParams = supportNewFunction.toDecimal as ToDecimalOptions
  ctx.setToDecimalOptions(toDecimalParams)
  const newFnS = new MagicStringAST(code)
  transformScript(code, newFnS, ctx)
  if (newFnS.hasChanged()) {
    const result = newFnS.toString().replace(RETURN_DECLARATION_PREFIX, '').slice(0, -1)
    s.overwriteNode(node, `${quote}${result}${quote}`)
  }
}
function resolveFunction(node: FunctionDeclaration | ArrowFunctionExpression | FunctionExpression, s: MagicStringAST, ctx: Context) {
  const { body } = node
  if (isStringNode(body)) {
    resolveStringTemplateLiteral(body, s, ctx)
    return
  }
  if (isStatement(body)) {
    const lastNode = body.body[body.body.length - 1]
    if (!isReturnStatement(lastNode)) {
      return
    }
    const { argument } = lastNode
    if (!argument || !isStringNode(argument)) {
      return
    }
    resolveStringTemplateLiteral(argument, s, ctx)
  }
}
