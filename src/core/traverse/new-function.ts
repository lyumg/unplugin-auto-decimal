import type { Binding, NodePath } from '@babel/traverse'
import type { Expression, FunctionDeclaration, Identifier, NewExpression, StringLiteral, TemplateLiteral, VariableDeclarator } from '@babel/types'
import type { Options } from '../../types'
import { isArrayExpression, isArrowFunctionExpression, isAssignmentExpression, isBlockStatement, isCallExpression, isFunctionDeclaration, isIdentifier, isMemberExpression, isNumericLiteral, isObjectProperty, isReturnStatement, isStringLiteral, isTemplateLiteral, isVariableDeclarator } from '@babel/types'
import { traverseAst } from '.'
import { RETURN_DECLARATION_CODE, RETURN_DECLARATION_FN, RETURN_DECLARATION_PREFIX } from '../constant'
import { getTransformed } from '../transform'
import { findScopeBinding, findTargetPath } from '../utils'

// TIPS 使用 new Function 时，__Decimal 为全局作用域，需要将 __Decimal 以参数的形式传递过去
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
  resolveNewFunctionReturnValue(path, lastArg, options)
  provideParamsDecimal(path, lastArg as Expression, options)
}

function resolveNewFunctionReturnValue(path: NodePath, node: any, options: Options) {
  if (isIdentifier(node) || (isCallExpression(node) && isIdentifier(node.callee))) {
    const fnName = isIdentifier(node) ? node.name : (node.callee as Identifier).name
    const variableBinding = findScopeBinding(path, fnName)
    if (!variableBinding)
      return
    resolveFunctionReturnVariable(options, variableBinding, fnName)
  }
  else if (isStringLiteral(node) || isTemplateLiteral(node)) {
    resolveStringTemplateLiteral(node, options)
  }
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
  const { supportNewFunction } = autoDecimalOptions
  const code = RETURN_DECLARATION_FN.replace(RETURN_DECLARATION_CODE, rawString)
  const toDecimalParams = typeof supportNewFunction === 'boolean' ? autoDecimalOptions.toDecimal : false
  const { msa: transformedMsa } = getTransformed(code, opts => traverseAst(opts, false), {
    ...autoDecimalOptions,
    toDecimal: toDecimalParams,
  })
  if (transformedMsa.hasChanged()) {
    const result = transformedMsa.toString().replace(RETURN_DECLARATION_PREFIX, '').slice(0, -1)
    options.msa.overwriteNode(node, `${quote}${result}${quote}`)
  }
}
// 解析 Function 参数 return 的变量
function resolveFunctionReturnVariable(options: Options, variableBinding: Binding, name?: string) {
  if (variableBinding.kind === 'param') {
    resolveParamsFormVariable(variableBinding, options, name)
  }
  const { constantViolations } = variableBinding
  if (constantViolations.length) {
    constantViolations.forEach((cv) => {
      if (isAssignmentExpression(cv.node)) {
        const { right } = cv.node
        resolveAssignmentExpression(cv, right, options)
      }
    })
  }
  else if (isVariableDeclarator(variableBinding.path.node)) {
    const { init } = variableBinding.path.node
    if (!init)
      return
    resolveAssignmentExpression(variableBinding.path, init, options)
  }
}

function resolveAssignmentExpression(path: NodePath, node: Expression, options: Options) {
  if (isStringLiteral(node) || isTemplateLiteral(node)) {
    resolveStringTemplateLiteral(node, options)
  }
  else if (isIdentifier(node)) {
    const binding = findScopeBinding(path, node.name)
    if (!binding)
      return
    resolveFunctionReturnVariable(options, binding)
  }
  else if (isCallExpression(node)) {
    const variableName = (node.callee as Identifier).name
    const binding = findScopeBinding(path, variableName)
    if (!binding)
      return
    const pathNode = binding.path.node
    if (isFunctionDeclaration(pathNode)) {
      resolveFunction(pathNode, options)
    }
    else if (isVariableDeclarator(pathNode)) {
      const { init } = pathNode
      if (isArrowFunctionExpression(init)) {
        if (isBlockStatement(init.body)) {
          resolveFunction(init as unknown as FunctionDeclaration, options)
        }
        else if (isStringLiteral(init.body) || isTemplateLiteral(init.body)) {
          resolveStringTemplateLiteral(init.body, options)
        }
      }
    }
    else {
      console.warn(`未处理的节点，line: ${node.loc!.start.line}, ${node.loc!.end.index}; column: ${node.loc!.start.column}, ${node.loc!.end.column}`)
    }
  }
}

function resolveParamsFormVariable(binding: Binding, options: Options, name?: string) {
  if (!isFunctionDeclaration(binding.scope.block) || !name) {
    return
  }
  const { block, path } = binding.scope
  const { params } = block
  if (!params.length)
    return
  const paramsIndex = params.findIndex(param => (param as Identifier).name === name)
  if (paramsIndex < 0)
    return
  const fnName = block.id?.name
  if (!fnName || !path.parentPath)
    return
  const handleFnBinding = findScopeBinding(path.parentPath, fnName)
  if (!handleFnBinding)
    return
  handleFnBinding.referencePaths.forEach((nodePath) => {
    if (!isCallExpression(nodePath.parent))
      return
    const targetParams = nodePath.parent.arguments[paramsIndex]
    if (!targetParams)
      return
    resolveNewFunctionReturnValue(nodePath, targetParams, options)
  })
}

function provideParamsDecimal(path: NodePath, node: Expression, options: Options) {
  if (!options.msa.hasChanged())
    return
  let parentPath: null | NodePath = path
  let params: string | number
  if (!isVariableDeclarator(path.parent)) {
    parentPath = findTargetPath(path, isVariableDeclarator)
    if (!parentPath)
      return
      // NOTE 函数的调用方式. 数组下标、对象属性；其他方式待完善
    if (isArrayExpression(path.parent)) {
      params = path.key!
    }
    else if (isObjectProperty(path.parent)) {
      // TIPS 目前不支持变量引用 [variable] 形式
      params = (path.parent.key as Identifier).name
    }
  }
  const callName = ((parentPath.parent as VariableDeclarator).id! as Identifier).name
  if (!callName)
    return
  const binding = findScopeBinding(path, callName)
  if (!binding?.referenced)
    return
  const paramsContent = `'${options.decimalPkgName}', ${options.msa.snipNode(node)}`
  options.msa.update(node.start!, node.end!, paramsContent)
  binding.referencePaths.forEach((referencePath) => {
    const { parent } = referencePath
    if (isMemberExpression(parent)) {
      if (isNumericLiteral(parent.property) || isIdentifier(parent.property)) {
        const targetParams = isNumericLiteral(parent.property) ? parent.property.value : parent.property.name
        if (targetParams !== params) {
          return
        }
        const parentPath = findTargetPath(referencePath, isCallExpression)
        if (!parentPath)
          return
        options.msa.update(parentPath.parent.end! - 1, parentPath.parent.end!, `, ${options.decimalPkgName})`)
      }
    }
    else if (isCallExpression(parent)) {
      options.msa.update(parent.end! - 1, parent.end!, `, ${options.decimalPkgName})`)
    }
  })
}

function resolveFunction(node: FunctionDeclaration, options: Options) {
  const { body } = node.body
  const lastNode = body[body.length - 1]
  if (!isReturnStatement(lastNode)) {
    return
  }
  const { argument } = lastNode
  if (!argument || (!isStringLiteral(argument) && !isTemplateLiteral(argument))) {
    return
  }
  resolveStringTemplateLiteral(argument, options)
}
