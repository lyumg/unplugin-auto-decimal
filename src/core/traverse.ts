import { isPackageExists } from 'local-pkg'
import type { NodePath } from '@babel/traverse'
import type { File, FunctionExpression, ImportDeclaration, ObjectExpression } from '@babel/types'
import type { TraverseOptions } from 'babel__traverse'
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
        if (!isPackageExists(PKG_NAME)) {
          throw new Error(`[Auto Decimal] You will need to install ${PKG_NAME}: "npm install ${PKG_NAME}"`)
        }
        options.imported = true
        options.msa.prepend(`\nimport ${options.decimalPkgName} from '${PKG_NAME}';\n`)
      },
    },
    ExportDefaultDeclaration(path) {
      if (!templateImport)
        return
      let { declaration } = path.node
      if (declaration.type !== 'ObjectExpression' && declaration.type !== 'CallExpression')
        return
      if (declaration.type === 'CallExpression') {
        const { arguments: args } = declaration
        const [objectExpr] = args
        if (!objectExpr || objectExpr.type !== 'ObjectExpression')
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
      if (path.node.expression.type === 'JSXEmptyExpression')
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
    if (prop.type === 'SpreadElement')
      return false
    if (prop.type === 'ObjectProperty' && prop.value.type !== 'FunctionExpression')
      return false
    if (prop.key.type !== 'Identifier' || (prop.key.type === 'Identifier' && prop.key.name !== 'data'))
      return false

    const body = prop.type === 'ObjectMethod' ? prop.body : (prop.value as FunctionExpression).body
    if (body.type !== 'BlockStatement')
      return false

    const returnStatement = body.body.find(item => item.type === 'ReturnStatement')
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
      if (spec.type === 'ImportDefaultSpecifier') {
        if (spec.local.name !== DECIMAL_PKG_NAME) {
          options.decimalPkgName = spec.local.name
        }
        return true
      }
      else if (spec.type === 'ImportNamespaceSpecifier') {
        options.decimalPkgName = `${spec.local.name}.Decimal`
        return true
      }
      else if (spec.imported.type === 'Identifier' && spec.imported.name !== DECIMAL_PKG_NAME) {
        options.decimalPkgName = spec.local.name
        return true
      }
      return false
    })
  }
}
