import type { NodePath } from '@babel/traverse'
import type { ImportDeclaration } from '@babel/types'
import type { Options } from '../../types'
import { isIdentifier, isImportDefaultSpecifier, isImportNamespaceSpecifier } from '@babel/types'
import { DECIMAL_PKG_NAME, PKG_NAME } from '../constant'

export function resolveImportDeclaration(path: NodePath<ImportDeclaration>, options: Options) {
  if (path.node.source.value === PKG_NAME) {
    options.imported = path.node.specifiers.some((spec) => {
      if (isImportDefaultSpecifier(spec)) {
        if (spec.local.name !== DECIMAL_PKG_NAME) {
          options.decimalPkgName = spec.local.name
        }
        return true
      }
      else if (isImportNamespaceSpecifier(spec)) {
        options.decimalPkgName = `${spec.local.name}.Decimal`
        return true
      }
      else if (isIdentifier(spec.imported) && spec.imported.name !== DECIMAL_PKG_NAME) {
        options.decimalPkgName = spec.local.name
        return true
      }
      return false
    })
  }
}
