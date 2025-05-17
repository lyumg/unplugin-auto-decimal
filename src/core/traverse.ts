import { isPackageExists } from 'local-pkg'
import type { NodePath, TraverseOptions } from '@babel/traverse'
import { isBinaryExpression, isBlockStatement, isCallExpression, isFunctionExpression, isIdentifier, isImportDefaultSpecifier, isImportNamespaceSpecifier, isJSXEmptyExpression, isMemberExpression, isObjectExpression, isObjectMethod, isObjectProperty, isReturnStatement, isSpreadElement } from '@babel/types'
import type { BinaryExpression, CallExpression, ExportDefaultDeclaration, File, FunctionExpression, ImportDeclaration, ObjectExpression } from '@babel/types'
import type { BigRoundingMode, DecimalLightRoundingMode, DecimalRoundingMode, Extra, InnerToDecimalOptions, Options, Package, RoundingModes } from '../types'
import { processBinary } from './binary'
import { blockComment, innerComment, nextComment } from './comment'
import { BLOCK_COMMENT, DECIMAL_PKG_NAME, DEFAULT_TO_DECIMAL_CONFIG, FILE_COMMENT, PKG_NAME } from './constant'
import { BIG_RM, DECIMAL_RM, DECIMAL_RM_LIGHT } from './rounding-modes'
import { mergeToDecimalOptions } from './options'

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
        case 'CallExpression':
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
          throw new Error(`[AutoDecimal] 请先安装 ${pkgName}`)
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
      handleImportDeclaration(path, options)
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
  }
}
function resolveExportDefaultDeclaration(path: NodePath<ExportDefaultDeclaration>, options: Options) {
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
function resolveBinaryExpression(path: NodePath<BinaryExpression>, options: Options) {
  const extra = (path.node.extra ?? {}) as unknown as Extra
  if (options.autoDecimalOptions.toDecimal && !extra.__shouldTransform)
    return
  if (extra.__shouldTransform) {
    path.node.extra = extra.__extra
    return processBinary(extra.options, path)
  }
  return processBinary({ ...options, initial: true }, path)
}
function resolveCallExpression(path: NodePath<CallExpression>, options: Options) {
  if (!options.autoDecimalOptions.toDecimal)
    return
  const { node } = path
  const { callee, arguments: args } = node
  if (!isMemberExpression(callee))
    return
  const toDecimalOptions: InnerToDecimalOptions = { ...DEFAULT_TO_DECIMAL_CONFIG }
  if (options.autoDecimalOptions.toDecimal) {
    mergeToDecimalOptions(toDecimalOptions, options.autoDecimalOptions.toDecimal)
  }
  const { property, object } = callee
  if (!isIdentifier(property) || property.name !== toDecimalOptions.name)
    return
  if (!isBinaryExpression(path.parentPath.node) && !isBinaryExpression(object)) {
    throw new SyntaxError(`
      line: ${path.parentPath.node.loc?.start.line}, ${options.msa.snipNode(path.parentPath.node).toString()} 或 ${options.msa.snipNode(object).toString()} 不是有效的计算表达式  
    `)
  }
  if (args && args.length > 0) {
    const [arg] = args
    if (!isObjectExpression(arg)) {
      throw new TypeError('toDecimal 参数错误')
    }
    const rawArg = options.msa.snipNode(arg).toString()
    const jsonArg = rawArg.replace(/(\w+):/g, '"$1":').replace(/'/g, '"')
    try {
      const argToDecimalOptions = JSON.parse(jsonArg)
      mergeToDecimalOptions(toDecimalOptions, argToDecimalOptions)
    }
    catch (e: unknown) {
      console.error(e)
    }
  }
  let callArgs = '()'
  if (toDecimalOptions.callMethod === 'toFixed') {
    callArgs = `(${toDecimalOptions.precision}, ${getRoundingMode(toDecimalOptions.roundingModes, options.autoDecimalOptions.package)})`
  }
  const start = object.end ?? 0
  options.msa.remove(start, node.end ?? 0)
  const resolveBinaryOptions = {
    ...options,
    initial: true,
    callArgs,
    callMethod: toDecimalOptions.callMethod,
  }
  if (isBinaryExpression(object)) {
    if (object.start !== node.start) {
      options.msa.remove(node.start ?? 0, object.start ?? 0)
    }
    object.extra = {
      ...object.extra,
      __extra: object.extra,
      options: resolveBinaryOptions,
      __shouldTransform: true,
    }
    return
  }
  const rootPath = findRootBinaryExprPath(path)
  processBinary(resolveBinaryOptions, rootPath as NodePath<BinaryExpression>)
}
function getRoundingMode(mode: RoundingModes | number, packageName: Package) {
  if (typeof mode === 'number') {
    return mode
  }
  if (packageName === 'big.js') {
    return BIG_RM[mode as BigRoundingMode]
  }
  if (packageName === 'decimal.js') {
    return DECIMAL_RM[mode as DecimalRoundingMode]
  }
  return DECIMAL_RM_LIGHT[mode as DecimalLightRoundingMode]
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
function findRootBinaryExprPath(path: NodePath) {
  let parentPath = path.parentPath
  let binaryPath = path
  let loop = true
  while (loop && parentPath) {
    if (isBinaryExpression(parentPath.node)) {
      binaryPath = parentPath
      parentPath = parentPath.parentPath
    }
    else {
      loop = false
    }
  }
  return binaryPath
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
