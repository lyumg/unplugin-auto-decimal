import type { TraverseOptions } from '@babel/traverse'
import type { File } from '@babel/types'
import type { Options } from '../../types'
import { isJSXEmptyExpression } from '@babel/types'
import { isPackageExists } from 'local-pkg'
import { BLOCK_COMMENT, FILE_COMMENT, PKG_NAME } from '../constant'
import { resolveBinaryExpression } from './binary-expression'
import { resolveCallExpression } from './call-expression'
import { blockComment, innerComment, nextComment } from './comment'
import { resolveExportDefaultDeclaration } from './export-declaration'
import { resolveImportDeclaration } from './import-declaration'
import { resolveNewFunctionExpression } from './new-function'

export function traverseAst(options: Options, checkImport = true, templateImport = false): TraverseOptions {
  return {
    enter(path) {
      switch (path.type) {
        case 'Program':
        case 'ImportDeclaration':
        case 'ExportDefaultDeclaration':
        case 'JSXElement':
        case 'JSXOpeningElement':
        case 'JSXExpressionContainer':
        case 'BinaryExpression':
          break
        default:
          blockComment(path)
          nextComment(path)
          break
      }
    },
    Program: {
      enter(path) {
        const file = path.parent as File
        const fileIgnore = file.comments?.some(comment => comment.value.includes(FILE_COMMENT)) ?? false
        options.imported = fileIgnore && templateImport
        if (fileIgnore && !templateImport) {
          path.skip()
        }
      },
      exit() {
        if (!checkImport || options.imported || (!options.msa.hasChanged() && !templateImport)) {
          return
        }
        if (!options.needImport)
          return
        const pkgName = options.autoDecimalOptions?.package ?? PKG_NAME
        if (!isPackageExists(pkgName)) {
          throw new ReferenceError(`[AutoDecimal] 请先安装 ${pkgName}`)
        }
        options.imported = true
        options.msa.prepend(`\nimport ${options.decimalPkgName} from '${pkgName}';\n`)
      },
    },
    ExportDefaultDeclaration(path) {
      if (!templateImport)
        return
      resolveExportDefaultDeclaration(path, options)
    },
    ImportDeclaration(path) {
      if (options.imported)
        return
      resolveImportDeclaration(path, options)
    },
    JSXElement: path => innerComment(path, BLOCK_COMMENT),
    JSXOpeningElement: (path) => {
      if (!path.node.attributes.length)
        return
      innerComment(path)
    },
    JSXExpressionContainer: (path) => {
      if (isJSXEmptyExpression(path.node.expression))
        return
      innerComment(path)
    },
    BinaryExpression: path => resolveBinaryExpression(path, options),
    CallExpression: path => resolveCallExpression(path, options),
    NewExpression: path => resolveNewFunctionExpression(path, options),
  }
}
