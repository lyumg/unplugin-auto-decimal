import type { NodePath } from '@babel/traverse'
import type { ImportDeclaration } from '@babel/types'
import type { Context } from '../context'
import { isIdentifier, isImportDefaultSpecifier, isImportNamespaceSpecifier } from '@babel/types'
import { DECIMAL_PKG_NAME, PKG_NAME } from '../constant'
/*
 * @Date: 2026-09-03 09:08:54
 * @Author: lyumg
 * @FilePath: /unplugin-auto-decimal/src/core/ast/import-declaration.ts
 */
export function resolveImportDeclaration(path: NodePath<ImportDeclaration>, ctx: Context) {
  if (path.node.source.value === PKG_NAME) {
    const defaultDecimalPkgName = ctx.options.decimalName || DECIMAL_PKG_NAME
    ctx.imported = path.node.specifiers.some((spec) => {
      if (isImportDefaultSpecifier(spec)) {
        if (spec.local.name !== defaultDecimalPkgName) {
          ctx.decimalPkgName = spec.local.name
        }
        return true
      }
      if (isImportNamespaceSpecifier(spec)) {
        const pkgName = ctx.options.package === 'big.js' ? 'Big' : 'Decimal'
        ctx.decimalPkgName = `${spec.local.name}.${pkgName}`
        return true
      }
      if (isIdentifier(spec.imported) && spec.imported.name !== defaultDecimalPkgName) {
        ctx.decimalPkgName = spec.local.name
        return true
      }
      return false
    })
  }
}
