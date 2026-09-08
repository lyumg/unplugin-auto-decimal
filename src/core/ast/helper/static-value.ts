/* eslint-disable eqeqeq */
import type { NodePath } from '@babel/traverse'
import type { FunctionDeclaration, FunctionExpression } from '@babel/types'
import {
  isArrayExpression,
  isArrowFunctionExpression,
  isBigIntLiteral,
  isBinaryExpression,
  isBlockStatement,
  isCallExpression,
  isConditionalExpression,
  isExpression,
  isFunction,
  isFunctionDeclaration,
  isFunctionExpression,
  isIdentifier,
  isLiteral,
  isLogicalExpression,
  isMemberExpression,
  isNewExpression,
  isNullLiteral,
  isObjectExpression,
  isObjectMethod,
  isObjectProperty,
  isRegExpLiteral,
  isSpreadElement,
  isTemplateLiteral,
  isUnaryExpression,
  isVariableDeclarator,
} from '@babel/types'

const BUILTIN_PURE_FUNCTIONS = new Map<string, (...args: any[]) => any>([
  ['Number', arg => Number(arg)],
  ['String', arg => String(arg)],
  ['Boolean', arg => Boolean(arg)],
  ['parseInt', (arg, radix) => Number.parseInt(arg, radix)],
  ['parseFloat', arg => Number.parseFloat(arg)],
  ['Object.keys', obj => (obj && typeof obj === 'object' ? Object.keys(obj) : [])],
  ['Object.values', obj => (obj && typeof obj === 'object' ? Object.values(obj) : [])],
])

/**
 * 检查节点是否为 import 导入
 * 仅简单处理直接引用 import 绑定的情况，不考虑间接引用
 */
function hasImportDependency(path: NodePath<any>, visited = new Set()) {
  if (visited.has(path.node))
    return false
  visited.add(path.node)

  // 如果是引用标识符
  if (isIdentifier(path.node) && path.isReferencedIdentifier()) {
    const binding = path.scope.getBinding(path.node.name)
    if (binding) {
      // 直接来自 import 语句
      if (binding.kind === 'module') {
        return true
      }
      // 如果绑定是变量声明，检查其初始化表达式
      if (isVariableDeclarator(binding.path.node)) {
        const initPath = binding.path.get('init')
        if (initPath.node && hasImportDependency(initPath, visited)) {
          return true
        }
      }
      // TODO 对于其他绑定（如函数声明、类声明等），一般不会来自 import
    }
    return false
  }

  // 是否为 require 调用
  if (isCallExpression(path.node)) {
    const callee = path.node.callee
    if (isIdentifier(callee) && callee.name === 'require') {
      return true
    }
  }

  // 递归遍历所有子节点，查找是否有 import 依赖
  let found = false
  path.traverse({
    Identifier(p) {
      if (p.isReferencedIdentifier()) {
        const binding = p.scope.getBinding(p.node.name)
        if (binding) {
          if (binding.kind === 'module') {
            found = true
            p.stop()
            return
          }
          if (isVariableDeclarator(binding.path.node)) {
            const initPath = binding.path.get('init')
            if (initPath.node && hasImportDependency(initPath, visited)) {
              found = true
              p.stop()
            }
          }
        }
      }
    },
    CallExpression(p) {
      const callee = p.node.callee
      if (isIdentifier(callee) && callee.name === 'require') {
        found = true
        p.stop()
      }
    },
  })
  return found
}

/**
 * 获取一个函数的返回值
 * 仅当函数体为单一 return 语句或返回表达式时有效
 */
function getFunctionReturnValue(funcPath: NodePath<FunctionExpression | FunctionDeclaration>, visited = new Set()) {
  const body = funcPath.get('body')
  if (isBlockStatement(body.node)) {
    // 获取所有 return 语句
    let returnValue
    let hasReturn = false
    body.traverse({
      ReturnStatement(p) {
        const arg = p.get('argument')
        if (arg.node) {
          const val = getStaticValueInternal(arg, visited)
          // 如果遇到多个 return，取第一个
          if (!hasReturn) {
            returnValue = val
            hasReturn = true
          }
        }
        else {
          // return; 相当于 undefined
          if (!hasReturn) {
            returnValue = undefined
            hasReturn = true
          }
        }
      },
    })
    return returnValue
  }
  else if (isExpression(body.node)) {
    // 箭头函数直接是表达式
    return getStaticValueInternal(body, visited)
  }
  return undefined
}

function getStaticValueInternal(path: any, visited = new Set()): any {
  if (visited.has(path.node))
    return undefined
  visited.add(path.node)

  // 仅获取当前代码作用域内的静态值，如果为 import 导入则直接返回 null
  if (hasImportDependency(path, new Set())) {
    return null
  }

  const { node } = path
  if (isLiteral(node)) {
    if (isRegExpLiteral(node)) {
      return new RegExp(node.pattern, node.flags)
    }
    if (isBigIntLiteral(node)) {
      return BigInt(node.value)
    }
    if (isNullLiteral(node)) {
      return null
    }

    if (isTemplateLiteral(node)) {
      let result = ''
      for (let i = 0; i < node.quasis.length; i++) {
        const quasi = node.quasis[i]
        result += quasi.value.cooked
        if (i < node.expressions.length) {
          const exprVal = getStaticValueInternal(path.get(`expressions.${i}`), visited)
          if (exprVal === null)
            return null
          if (exprVal !== undefined) {
            result += String(exprVal)
          }
          else {
            return undefined
          }
        }
      }
      return result
    }
    // 其他字面量直接返回 node.value
    return node.value
  }

  if (isIdentifier(node) && path.isReferencedIdentifier()) {
    const binding = path.scope.getBinding(node.name)
    if (!binding)
      return undefined
    if (binding.kind === 'module')
      return null
    if (isVariableDeclarator(binding.path.node)) {
      const initPath = binding.path.get('init')
      if (initPath.node) {
        return getStaticValueInternal(initPath, visited)
      }
      return undefined
    }
    if (binding.path.isFunctionDeclaration() || binding.path.isFunctionExpression()) {
      // 尝试获取函数的返回值
      return getFunctionReturnValue(binding.path, visited)
    }
    return undefined
  }

  if (isMemberExpression(node)) {
    const objVal = getStaticValueInternal(path.get('object'), visited)
    // null 表示为 import 导入
    if (objVal === null || objVal === undefined)
      return objVal
    let propVal
    if (isIdentifier(node.property) && !node.computed) {
      propVal = node.property.name
    }
    else {
      const propPath = path.get('property')
      propVal = getStaticValueInternal(propPath, visited)
      if (propVal === null || propVal === undefined)
        return propVal
    }
    // 尝试访问对象属性
    if (objVal !== undefined && propVal !== undefined) {
      // 支持数组索引（数字字符串转换为数字）
      if (Array.isArray(objVal) && typeof propVal === 'string') {
        const index = Number(propVal)
        if (!Number.isNaN(index) && Number.isInteger(index)) {
          return objVal[index]
        }
      }
      return objVal[propVal]
    }
    return undefined
  }

  if (isObjectExpression(node)) {
    const result: Record<string, any> = {}
    for (const prop of node.properties) {
      if (isObjectProperty(prop) || isObjectMethod(prop)) {
        if (isObjectProperty(prop)) {
          let key
          if (isIdentifier(prop.key) && !prop.computed) {
            key = prop.key.name
          }
          else {
            const keyPath = path.get(`properties.${node.properties.indexOf(prop)}.key`)
            const keyVal = getStaticValueInternal(keyPath, visited)
            if (keyVal === null)
              return null
            key = keyVal
          }
          const valPath = path.get(`properties.${node.properties.indexOf(prop)}.value`)
          const val = getStaticValueInternal(valPath, visited)
          if (val === null)
            return null
          result[key] = val
        }
        else {
          // 方法跳过
        }
      }
      else if (isSpreadElement(prop)) {
        const spreadVal = getStaticValueInternal(path.get(`properties.${node.properties.indexOf(prop)}.argument`), visited)
        if (spreadVal === null)
          return null
        if (typeof spreadVal === 'object' && spreadVal !== null) {
          Object.assign(result, spreadVal)
        }
      }
    }
    return result
  }

  if (isArrayExpression(node)) {
    const result = []
    for (let i = 0; i < node.elements.length; i++) {
      const elem = node.elements[i]
      if (elem === null) {
        result.push(null)
      }
      else if (isSpreadElement(elem)) {
        const spreadVal = getStaticValueInternal(path.get(`elements.${i}.argument`), visited)
        if (spreadVal === null)
          return null
        if (Array.isArray(spreadVal)) {
          result.push(...spreadVal)
        }
        else {
          result.push(spreadVal)
        }
      }
      else {
        const val = getStaticValueInternal(path.get(`elements.${i}`), visited)
        if (val === null)
          return null
        result.push(val)
      }
    }
    return result
  }

  if (isBinaryExpression(node)) {
    const left = getStaticValueInternal(path.get('left'), visited)
    const right = getStaticValueInternal(path.get('right'), visited)
    if (left === null || right === null)
      return null
    if (left === undefined || right === undefined)
      return undefined
    try {
      switch (node.operator) {
        case '+': return left + right
        case '-': return left - right
        case '*': return left * right
        case '/': return left / right
        case '%': return left % right
        case '**': return left ** right
        case '==': return left == right
        case '!=': return left != right
        case '===': return left === right
        case '!==': return left !== right
        case '<': return left < right
        case '<=': return left <= right
        case '>': return left > right
        case '>=': return left >= right
        default: return undefined
      }
    }
    catch {
      return undefined
    }
  }

  if (isUnaryExpression(node)) {
    const arg = getStaticValueInternal(path.get('argument'), visited)
    if (arg === null || arg === undefined)
      return arg
    try {
      switch (node.operator) {
        case '+': return +arg
        case '-': return -arg
        case '!': return !arg
        case '~': return ~arg
        case 'typeof': return typeof arg
        case 'void': return void arg
        case 'delete': return undefined
        default: return undefined
      }
    }
    catch {
      return undefined
    }
  }

  if (isLogicalExpression(node)) {
    const left = getStaticValueInternal(path.get('left'), visited)
    if (left === null)
      return null
    if (left === undefined)
      return undefined
    // 短路求值
    if (node.operator === '&&') {
      if (!left)
        return left
      const right = getStaticValueInternal(path.get('right'), visited)
      if (right === null)
        return null
      return right
    }
    else if (node.operator === '||') {
      if (left)
        return left
      const right = getStaticValueInternal(path.get('right'), visited)
      if (right === null)
        return null
      return right
    }
    else if (node.operator === '??') {
      if (left !== null && left !== undefined)
        return left
      const right = getStaticValueInternal(path.get('right'), visited)
      if (right === null)
        return null
      return right
    }
    return undefined
  }

  if (isConditionalExpression(node)) {
    const test = getStaticValueInternal(path.get('test'), visited)
    if (test === null)
      return null
    if (test === undefined)
      return undefined
    const branch = test ? path.get('consequent') : path.get('alternate')
    return getStaticValueInternal(branch, visited)
  }

  if (isCallExpression(node)) {
    if (isIdentifier(node.callee) && node.callee.name === 'require') {
      return null
    }

    // 处理内置纯函数
    let calleeName = null
    if (isIdentifier(node.callee)) {
      calleeName = node.callee.name
    }
    else if (isMemberExpression(node.callee) && !node.callee.computed) {
      // 如 Object.keys
      const objPart = getStaticValueInternal(path.get('callee.object'), visited)
      if (objPart === null)
        return null
      const propPart = getStaticValueInternal(path.get('callee.property'), visited)
      if (propPart === null)
        return null
      if (typeof objPart === 'object' && typeof propPart === 'string') {
        calleeName = `${objPart.constructor?.name || ''}.${propPart}`
        if (objPart.constructor?.name === 'Object' && propPart === 'keys')
          calleeName = 'Object.keys'
      }
    }
    if (calleeName && BUILTIN_PURE_FUNCTIONS.has(calleeName)) {
      const args = node.arguments.map((arg, idx) => {
        const argVal = getStaticValueInternal(path.get(`arguments.${idx}`), visited)
        if (argVal === null)
          return null
        return argVal
      })
      if (args.includes(null))
        return null
      if (args.includes(undefined))
        return undefined
      try {
        const fn = BUILTIN_PURE_FUNCTIONS.get(calleeName)
        return (fn as (...args: any[]) => any)(...args)
      }
      catch {
        return undefined
      }
    }

    // 尝试解析函数定义并求值返回值
    let funcBinding = null
    if (isIdentifier(node.callee)) {
      funcBinding = path.scope.getBinding(node.callee.name)
    }
    else if (isMemberExpression(node.callee)) {
      // 例如 obj.method
      const objVal = getStaticValueInternal(path.get('callee.object'), visited)
      if (objVal === null || objVal === undefined)
        return objVal
      const propVal = getStaticValueInternal(path.get('callee.property'), visited)
      if (propVal === null || propVal === undefined)
        return propVal
      // 尝试获取其属性对应的函数
      if (typeof objVal === 'object' && objVal !== null) {
        const method = objVal[propVal]
        if (typeof method === 'function') {
          return undefined
        }
      }
    }
    if (funcBinding && (isFunctionDeclaration(funcBinding.path.node) || isFunctionExpression(funcBinding.path.node) || isArrowFunctionExpression(funcBinding.path.node))) {
      // 尝试执行函数（只处理无参或参数可求值的情况）
      const args = node.arguments.map((arg, idx) => getStaticValueInternal(path.get(`arguments.${idx}`), visited))
      if (args.includes(null))
        return null
      if (args.includes(undefined))
        return undefined
      // 无法真正的执行函数，只能尝试分析函数体返回值，前提为该函数是一个纯函数
      // 或者，可以尝试通过函数体计算，但参数可能影响返回值，所以先返回 undefined
      // 如果函数体是简单的 return 表达式且不引用参数，可以求值
      const body = funcBinding.path.get('body')
      // 检查函数体是否使用了参数
      let usesParams = false
      body.traverse({
        Identifier(p: NodePath) {
          if (p.isReferencedIdentifier()) {
            const binding = p.scope.getBinding(p.node.name)
            // 如果 binding 是参数
            if (binding && binding.kind === 'param') {
              usesParams = true
              p.stop()
            }
          }
        },
      })
      if (!usesParams) {
        // 不依赖参数，尝试获取返回值
        const retVal = getFunctionReturnValue(funcBinding.path, visited)
        return retVal
      }
      // 依赖参数，返回 undefined
      return undefined
    }

    return undefined
  }

  if (isNewExpression(node)) {
    // 处理内置构造函数：Date, RegExp, Error 等
    if (isIdentifier(node.callee)) {
      const name = node.callee.name
      if (name === 'Date') {
        const args = node.arguments.map((arg, idx) => getStaticValueInternal(path.get(`arguments.${idx}`), visited))
        if (args.includes(null))
          return null
        if (args.includes(undefined))
          return undefined
        try {
          // @ts-expect-error Date 构造函数参数类型为 any[]
          return new Date(...args)
        }
        catch {
          return undefined
        }
      }
      if (name === 'RegExp') {
        const args = node.arguments.map((arg, idx) => getStaticValueInternal(path.get(`arguments.${idx}`), visited))
        if (args.includes(null))
          return null
        if (args.includes(undefined))
          return undefined
        try {
          return new RegExp(args[0], args[1])
        }
        catch {
          return undefined
        }
      }
      if (name === 'Error') {
        const args = node.arguments.map((arg, idx) => getStaticValueInternal(path.get(`arguments.${idx}`), visited))
        if (args.includes(null))
          return null
        if (args.includes(undefined))
          return undefined
        try {
          return new Error(args[0])
        }
        catch {
          return undefined
        }
      }
    }
    return undefined
  }

  // 箭头函数/函数表达式/函数声明
  if (isFunction(node)) {
    // 尝试获取返回值（无参数依赖）
    const retVal = getFunctionReturnValue(path, visited)
    return retVal
  }

  return undefined
}

/**
 * 公开的静态值获取函数
 * @param {NodePath} path - 任意节点的 Path
 *   - 若包含 import 依赖 → null
 *   - 若能静态求值 → 求值结果
 *   - 若无法确定 → undefined
 */
export function getStaticValue(path: NodePath) {
  return getStaticValueInternal(path, new Set())
}

/**
 * 仅检测 import 依赖
 */
export { hasImportDependency }
