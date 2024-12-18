import { isPackageExists } from 'local-pkg'
import type { NodePath, TraverseOptions } from '@babel/traverse'
import { isBlockStatement, isCallExpression, isFunctionExpression, isIdentifier, isImportDefaultSpecifier, isImportNamespaceSpecifier, isJSXEmptyExpression, isObjectExpression, isObjectMethod, isObjectProperty, isReturnStatement, isSpreadElement } from '@babel/types'
import type { File, FunctionExpression, ImportDeclaration, ObjectExpression } from '@babel/types'
import type { Options } from '../types'
import { processBinary } from './binary'
import { blockComment, innerComment, nextComment } from './comment'
import { BLOCK_COMMENT, DECIMAL_PKG_NAME, FILE_COMMENT, PKG_NAME } from './constant'

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
        const pkgName = options.autoDecimalOptions?.package ?? PKG_NAME
        if (!isPackageExists(pkgName)) {
          throw new Error(`[Auto Decimal] You will need to install ${pkgName}: "npm install ${pkgName}"`)
        }
        options.imported = true
        options.msa.prepend(`\nimport ${options.decimalPkgName} from '${pkgName}';\n`)
      },
    },
    ExportDefaultDeclaration(path) {
      if (!templateImport)
        return
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
        const insertPosition = declaration.start ?? 0 + 1
        const content = `
          \n
          data() {
            this.${options.decimalPkgName} = ${options.decimalPkgName};
          },
          \n
        `
        options.msa.prependRight(insertPosition, content)
      }
    },
    ImportDeclaration(path) {
      if (options.imported)
        return
      handleImportDeclaration(path, options)
    },
    JSXElement: path => innerComment(path, BLOCK_COMMENT),
    JSXOpeningElement: (path) => {
      const { attributes } = path.node
      if (!attributes.length)
        return
      innerComment(path)
    },
    JSXExpressionContainer: (path) => {
      if (isJSXEmptyExpression(path.node.expression))
        return
      innerComment(path)
    },
    BinaryExpression: path => processBinary({ ...options, initial: true }, path),
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
export function handleImportDeclaration(path: NodePath<ImportDeclaration>, options: Options) {
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
