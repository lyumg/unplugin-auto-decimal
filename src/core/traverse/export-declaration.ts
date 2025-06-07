import type { NodePath } from '@babel/traverse'
import type { ExportDefaultDeclaration, FunctionExpression, ObjectExpression } from '@babel/types'
import {
  isBlockStatement,
  isCallExpression,
  isFunctionExpression,
  isIdentifier,
  isObjectExpression,
  isObjectMethod,
  isObjectProperty,
  isReturnStatement,
  isSpreadElement,
} from '@babel/types'
import type { Options } from '../../types'

export function resolveExportDefaultDeclaration(path: NodePath<ExportDefaultDeclaration>, options: Options) {
  let { declaration } = path.node
  if (!isObjectExpression(declaration) && !isCallExpression(declaration))
    return
  if (isCallExpression(declaration)) {
    const { arguments: args } = declaration
    const [objectExpr] = args
    if (!objectExpr || !isObjectExpression(objectExpr))
      return
    declaration = objectExpr
  }
  const hasDataProperty = existDataProperty(declaration, options)
  if (!hasDataProperty) {
    const insertPosition = (declaration.start ?? 0) + 1
    const content = `
  \n
  data() {
    this.${options.decimalPkgName} = ${options.decimalPkgName};
  },
  \n
`
    options.msa.prependLeft(insertPosition, content)
  }
}

function existDataProperty(declaration: ObjectExpression, options: Options) {
  const { properties } = declaration
  /**
   * 检查是否存在 data 函数, 仅支持 data 函数, 不支持 data 对象
   * export default {
   *  data() {}
   * }
   */
  return properties.some((prop) => {
    if (isSpreadElement(prop))
      return false
    if (isObjectProperty(prop) && !isFunctionExpression(prop.value))
      return false
    if (!isIdentifier(prop.key) || (isIdentifier(prop.key) && prop.key.name !== 'data'))
      return false

    const body = isObjectMethod(prop) ? prop.body : (prop.value as FunctionExpression).body
    if (!isBlockStatement(body))
      return false

    const returnStatement = body.body.find(item => isReturnStatement(item))
    if (!returnStatement)
      return false
    const content = `\nthis.${options.decimalPkgName} = ${options.decimalPkgName};\n`
    options.msa.prependLeft(returnStatement.start!, content)
    return true
  })
}
