import type { Binding, NodePath } from '@babel/traverse'
import type { ArrowFunctionExpression, AssignmentExpression, Expression, FunctionDeclaration, FunctionExpression, Identifier, NewExpression, Node, StringLiteral, TemplateLiteral } from '@babel/types'
import type { NewFunctionOptions, Options } from '../../types'
import { isArrayExpression, isAssignmentExpression, isCallExpression, isIdentifier, isMemberExpression, isNodesEquivalent, isNumericLiteral, isObjectProperty, isReturnStatement, isStatement, isStringLiteral, isVariableDeclarator } from '@babel/types'
import { traverseAst } from '.'
import { RETURN_DECLARATION_CODE, RETURN_DECLARATION_FN, RETURN_DECLARATION_PREFIX } from '../constant'
import { getTransformed } from '../transform'
import { findScopeBinding, findTargetPath, getFunctionName, isFunctionNode, isStringNode } from '../utils'

// TIPS 使用 new Function 时，需要将 __Decimal 以参数的形式传递过去
export function resolveNewFunctionExpression(path: NodePath<NewExpression>, options: Options) {
  if (!options.autoDecimalOptions.supportNewFunction)
    return
  const { node } = path
  const { callee, arguments: args } = node
  if (!isIdentifier(callee) || callee.name !== 'Function')
    return
  if (args.length === 0)
    return
  const lastArg = args[args.length - 1]
  resolveReturnParam(path, lastArg, options)
  const { injectWindow } = options.autoDecimalOptions.supportNewFunction as NewFunctionOptions
  if (!injectWindow) {
    provideDecimal(path, lastArg as Expression, options)
  }
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
function resolveReturnParam(path: NodePath, node: Node, options: Options) {
  if (isStringNode(node)) {
    return resolveStringTemplateLiteral(node, options)
  }
  if (isIdentifier(node) || (isCallExpression(node) && isIdentifier(node.callee))) {
    const name = isIdentifier(node) ? node.name : (node.callee as Identifier).name
    const binding = findScopeBinding(path, name)
    resolveVariableParam(options, binding, name)
  }
}

function resolveVariableParam(options: Options, binding?: Binding, name?: string) {
  if (!binding)
    return
  if (binding.kind === 'param') {
    resolveVariableOfParam(binding, options, name)
  }
  const { constantViolations, path } = binding
  if (isVariableDeclarator(path.node)) {
    const { init } = path.node
    if (!init)
      return
    resolveAssignmentExpression(path, init, options)
  }
  constantViolations.forEach((cv) => {
    if (isAssignmentExpression(cv.node)) {
      const { right } = cv.node
      resolveAssignmentExpression(cv, right, options)
    }
  })
}

function resolveAssignmentExpression(path: NodePath, node: Expression, options: Options) {
  if (isStringNode(node)) {
    return resolveStringTemplateLiteral(node, options)
  }
  if (isFunctionNode(node)) {
    return resolveFunction(node, options)
  }
  if (isIdentifier(node)) {
    const binding = findScopeBinding(path, node.name)
    return resolveVariableParam(options, binding)
  }
  if (isCallExpression(node)) {
    const variableName = (node.callee as Identifier).name
    const binding = findScopeBinding(path, variableName)
    if (!binding)
      return
    const pathNode = binding.path.node
    if (isFunctionNode(pathNode)) {
      resolveFunction(pathNode, options)
      return
    }
    if (isVariableDeclarator(pathNode) && isFunctionNode(pathNode.init)) {
      resolveFunction(pathNode.init, options)
      return
    }
    console.warn(`未处理的节点，line: ${node.loc!.start.line}, ${node.loc!.end.index}; column: ${node.loc!.start.column}, ${node.loc!.end.column}`)
  }
}
// 解析参数形式的变量
function resolveVariableOfParam(binding: Binding, options: Options, name?: string) {
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
  const parentBinding = findScopeBinding(path.parentPath, fnName)
  if (!parentBinding)
    return
  parentBinding.referencePaths.forEach((nodePath) => {
    if (!isCallExpression(nodePath.parent))
      return
    const targetParams = nodePath.parent.arguments[paramsIndex]
    if (!targetParams)
      return
    resolveReturnParam(nodePath, targetParams, options)
  })
}

function provideDecimal(path: NodePath, node: Expression, options: Options) {
  if (!options.msa.hasChanged())
    return
  let parentPath: null | NodePath = path.parentPath
  let params: string | number
  // Decimal 形参
  const decimalParamsContent = `'${options.decimalPkgName}', ${options.msa.snipNode(node)}`
  const { parent } = path
  let callName = ''
  if (isCallExpression(parent)) {
    options.msa.update(node.start!, node.end!, decimalParamsContent)
    options.msa.update(parent.end! - 1, parent.end!, `, ${options.decimalPkgName})`)
    return
  }
  if (isAssignmentExpression(parent)) {
    const { left } = parent
    if (isIdentifier(left)) {
      callName = left.name
    }
    // 如果为 obj.x.x.x or arr[x][x][x] 形式调用
    else if (isMemberExpression(left)) {
      const binding = findScopeBinding(parentPath, left)
      if (!binding)
        return
      binding.referencePaths.forEach((reference) => {
        const referenceParent = reference.parentPath!.parent
        if (isCallExpression(referenceParent)) {
          options.msa.update(referenceParent.end! - 1, referenceParent.end!, `, ${options.decimalPkgName})`)
          return
        }
        if (isAssignmentExpression(referenceParent)) {
          const { right } = referenceParent
          if (isNodesEquivalent(right, path.node)) {
            options.msa.update(node.start!, node.end!, decimalParamsContent)
          }
          return
        }
        if (isMemberExpression(referenceParent)) {
          const targetPath = findTargetPath(reference, isCallExpression)
          if (targetPath) {
            options.msa.update(targetPath.node.end! - 1, targetPath.node.end!, `, ${options.decimalPkgName})`)
          }
          else {
            const targetPath = findTargetPath(reference, isAssignmentExpression)
            if (!targetPath)
              return
            const { right } = targetPath.node as AssignmentExpression
            if (isNodesEquivalent(right, path.node)) {
              options.msa.update(node.start!, node.end!, decimalParamsContent)
            }
          }
        }
      })
      return
    }
  }
  else if (!isVariableDeclarator(parent)) {
    parentPath = findTargetPath(path, isVariableDeclarator)
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
  const binding = findScopeBinding(path, callName)
  if (!binding?.referenced)
    return
  options.msa.update(node.start!, node.end!, decimalParamsContent)
  binding.referencePaths.forEach((referencePath) => {
    const { parent } = referencePath
    if (isCallExpression(parent)) {
      options.msa.update(parent.end! - 1, parent.end!, `, ${options.decimalPkgName})`)
      return
    }
    if (isMemberExpression(parent)) {
      if (isNumericLiteral(parent.property) || isIdentifier(parent.property)) {
        const targetParams = isNumericLiteral(parent.property) ? parent.property.value : parent.property.name
        if (targetParams !== params) {
          return
        }
        const targetPath = findTargetPath(referencePath, isCallExpression)
        if (!targetPath)
          return
        options.msa.update(targetPath.node.end! - 1, targetPath.node.end!, `, ${options.decimalPkgName})`)
      }
    }
  })
}

function resolveStringTemplateLiteral(node: StringLiteral | TemplateLiteral, options: Options) {
  let rawString = ''
  let quote = '\''
  if (isStringLiteral(node)) {
    rawString = node.value
  }
  else {
    quote = '`'
    rawString = options.msa.snipNode(node).toString().slice(1, -1)
  }
  const { autoDecimalOptions } = options
  const supportNewFunction = autoDecimalOptions.supportNewFunction as NewFunctionOptions
  const code = RETURN_DECLARATION_FN.replace(RETURN_DECLARATION_CODE, rawString)
  const toDecimalParams = supportNewFunction.toDecimal ?? false
  const runtimeOptions = {} as Options
  const { msa: transformedMsa } = getTransformed(code, opts => traverseAst(Object.assign(runtimeOptions, opts, {
    fromNewFunction: true,
    needImport: options.needImport,
  }), false), {
    ...autoDecimalOptions,
    toDecimal: toDecimalParams,
  })
  if (transformedMsa.hasChanged()) {
    Object.assign(options, {
      fromNewFunction: runtimeOptions.fromNewFunction,
      needImport: runtimeOptions.needImport,
    })
    const result = transformedMsa.toString().replace(RETURN_DECLARATION_PREFIX, '').slice(0, -1)
    options.msa.overwriteNode(node, `${quote}${result}${quote}`)
  }
}
function resolveFunction(node: FunctionDeclaration | ArrowFunctionExpression | FunctionExpression, options: Options) {
  const { body } = node
  if (isStringNode(body)) {
    resolveStringTemplateLiteral(body, options)
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
    resolveStringTemplateLiteral(argument, options)
  }
}
