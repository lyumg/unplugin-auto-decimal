/*
 * @Date: 2026-09-03 14:11:27
 * @Author: lyumg
 * @FilePath: /unplugin-auto-decimal/src/core/ast/visit.ts
 */

import type { TraverseOptions } from '@babel/traverse'
import type { File } from '@babel/types'
import type { MagicStringAST } from 'magic-string-ast'
import type { Context } from '../context'
import { isJSXEmptyExpression } from '@babel/types'
import { BLOCK_COMMENT, FILE_COMMENT, PKG_NAME } from '../constant'
import { resolveBinaryExpression } from './binary-expr'
import { resolveCallExpression } from './call-expr'
import { blockComment, innerComment, nextComment } from './comment'
import { resolveImportDeclaration } from './import-declaration'
import { resolveNewFunctionExpression } from './new-fn'

export function visitAST(s: MagicStringAST, ctx: Context): TraverseOptions {
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
        if (fileIgnore) {
          path.skip()
        }
      },
      exit() {
        if (ctx.needImport && !ctx.imported && !ctx.internal && s.hasChanged()) {
          const pkgName = ctx.options.package ?? PKG_NAME
          s.prependLeft(0, `\nimport ${ctx.decimalPkgName} from '${pkgName}';\n`)
          ctx.imported = true
          ctx.needImport = false
        }
        ctx.reset()
      },
    },
    ImportDeclaration(path) {
      if (ctx.imported)
        return
      resolveImportDeclaration(path, ctx)
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
    BinaryExpression: path => resolveBinaryExpression(path, s, ctx),
    CallExpression: path => resolveCallExpression(path, s, ctx),
    NewExpression: path => resolveNewFunctionExpression(path, s, ctx),
  }
}
