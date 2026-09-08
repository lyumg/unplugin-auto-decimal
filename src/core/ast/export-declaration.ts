import type { NodePath } from '@babel/traverse'
import type { ExportDefaultDeclaration, FunctionExpression, ObjectExpression } from '@babel/types'
import type { MagicStringAST } from 'magic-string-ast'
import type { Context } from '../context'
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
/*
 * @Date: 2026-09-03 09:08:51
 * @Author: lyumg
 * @FilePath: /unplugin-auto-decimal/src/core/ast/export-declaration.ts
 */
export function resolveExportDefaultDeclaration(path: NodePath<ExportDefaultDeclaration>, s: MagicStringAST, ctx: Context) {
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
  ctx.hasExportDefault = true
  const hasDataProperty = existDataProperty(declaration, s, ctx)
  if (!hasDataProperty) {
    const insertPosition = (declaration.start ?? 0) + 1
    const provideContent = [
      '\n\tdata() {',
      `\t\tthis.${ctx.decimalPkgName} = ${ctx.decimalPkgName};`,
      '\t}',
      '}',
    ]
    s.prependLeft(insertPosition, provideContent.join('\n'))
  }
}

function existDataProperty(declaration: ObjectExpression, s: MagicStringAST, ctx: Context) {
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
    const content = `this.${ctx.decimalPkgName} = ${ctx.decimalPkgName};\n\t`
    s.prependLeft(returnStatement.start!, content)
    return true
  })
}
