import type { TraverseOptions } from '@babel/traverse'
import type {
  CommentNode,
  CompoundExpressionNode,
  DirectiveNode,
  ElementNode,
  ForNode,
  IfBranchNode,
  InterpolationNode,
  TemplateChildNode,
} from '@vue/compiler-core'
import type { SFCScriptBlock } from '@vue/compiler-sfc'
import type { CommentState } from '../../types'
import type { Context } from '../context'
import traverse from '@babel/traverse'
import { isObjectExpression } from '@babel/types'
import { NodeTypes } from '@vue/compiler-core'
import { babelParse, parse } from '@vue/compiler-sfc'
import { MagicStringAST } from 'magic-string-ast'
import { resolveExportDefaultDeclaration } from '../ast/export-declaration'
import { getASTPlugins } from '../ast/helper/ast-plugin'
import { BLOCK_COMMENT, NEXT_COMMENT, OPERATOR_KEYS, PATCH_DECLARATION } from '../constant'
import transformScript from './script'
/*
 * @Date: 2026-09-02 16:12:44
 * @Author: lyumg
 * @FilePath: /unplugin-auto-decimal/src/core/transformers/vue.ts
 */
export default function transformVue(code: string, s: MagicStringAST, ctx: Context) {
  const sfcAst = parse(code)
  const { script, scriptSetup, template } = sfcAst.descriptor
  const processScript = (scriptSection: SFCScriptBlock | null) => {
    if (!scriptSection)
      return
    const lang = scriptSection.lang
    ctx.ext = lang ? `.${lang}` : '.js'
    const { start, end } = scriptSection.loc
    const scriptS = new MagicStringAST(scriptSection.content)
    transformScript(scriptSection.content, scriptS, ctx)
    if (scriptS.hasChanged()) {
      s.update(start.offset, end.offset, scriptS.toString())
    }
    return scriptS
  }
  // 处理 setup 函数
  const scriptSetupS = processScript(scriptSetup)
  // 处理 script 函数
  const scriptS = processScript(script)
  if (template) {
    const { ast, attrs = {} } = template
    if (!attrs['ad-ignore'] && ast?.children) {
      ctx.internal = true
      parserTemplate(ast.children, s, ctx)
      ctx.internal = false
    }
  }
  if (!ctx.needImport || !ctx.templateChange) {
    return
  }
  // 这里意味着 script 已经注入了 import, 直接添加绑定即可
  if (ctx.imported) {
    // script setup 不需要注入绑定语句
    if (scriptS) {
      provideDecimalBinding(script, scriptS, s, ctx)
    }
    return
  }
  // 不存在任何 script 的时候，需要添加绑定语句
  if (!scriptSetup && !script) {
    // 为了避免低版本 vue 不支持 setup， 所以使用 option api 进行数据绑定
    const provideContent = [
      '\n<script>',
      `import ${ctx.decimalPkgName} from '${ctx.options.package}';`,
      'export default {',
      '\tdata() {',
      `\t\tthis.${ctx.decimalPkgName} = ${ctx.decimalPkgName};`,
      '\t}',
      '}',
      '</script>',
    ]
    s.append(provideContent.join('\n'))
    return
  }
  //
  const contentS = scriptSetupS || scriptS
  if (!contentS)
    return
  const scriptSection = scriptSetup || script
  contentS.prependLeft(0, `\nimport ${ctx.decimalPkgName} from '${ctx.options.package}';`)
  s.update(scriptSection!.loc.start.offset, scriptSection!.loc.end.offset, contentS.toString())
  if (scriptSetup) {
    return
  }
  provideDecimalBinding(script, contentS, s, ctx)
}
function provideDecimalBinding(script: SFCScriptBlock | null, contentS: MagicStringAST, s: MagicStringAST, ctx: Context) {
  if (!script)
    return
  ctx.ext = script?.lang ? `.${script?.lang}` : '.js'
  // @ts-expect-error adapter cjs
  const walk = traverse.default ?? traverse
  const scriptAst = babelParse(script.content, {
    sourceType: 'module',
    plugins: getASTPlugins(ctx),
  })
  walk(scriptAst, {
    Program: {
      exit: () => {
        if (ctx.hasExportDefault) {
          return
        }
        const provideContent = [
          'export default {',
          '\tdata() {',
          `\t\tthis.${ctx.decimalPkgName} = ${ctx.decimalPkgName};`,
          '\t}',
          '}\n',
        ]
        contentS.append(provideContent.join('\n'))
      },
    },
    ExportDefaultDeclaration: path => resolveExportDefaultDeclaration(path, contentS, ctx),
  } as TraverseOptions)
  s.update(script!.loc.start.offset, script!.loc.end.offset, contentS.toString())
}

function parserTemplate(children: TemplateChildNode[], s: MagicStringAST, ctx: Context) {
  const commentState: CommentState = { line: 0, block: false, next: false }
  children.forEach((child) => {
    if (child.type === NodeTypes.TEXT)
      return
    if (child.type === NodeTypes.COMMENT) {
      updateCommentState(child, commentState)
      return
    }
    if (shouldSkipComment(child, commentState, 'block'))
      return

    switch (child.type) {
      case NodeTypes.INTERPOLATION:
        handleInterpolation(child, commentState, s, ctx)
        break
      case NodeTypes.ELEMENT:
        handleElementProps(child, commentState, s, ctx)
        break
      default:
        break
    }
    if (hasChildrenNode(child) && child.children) {
      parserTemplate(child.children as TemplateChildNode[], s, ctx)
    }
  })
}
function hasChildrenNode(
  child: TemplateChildNode,
): child is ElementNode | CompoundExpressionNode | IfBranchNode | ForNode {
  const nodeTypes = [NodeTypes.ELEMENT, NodeTypes.COMPOUND_EXPRESSION, NodeTypes.IF_BRANCH, NodeTypes.FOR]
  return nodeTypes.includes(child.type)
}
function updateCommentState(commentNode: CommentNode, commentState: CommentState) {
  commentState.line = commentNode.loc.start.line
  commentState.block = commentNode.content.includes(BLOCK_COMMENT)
  commentState.next = commentNode.content.includes(NEXT_COMMENT)
}
function handleInterpolation(interpolationNode: InterpolationNode, commentState: CommentState, s: MagicStringAST, ctx: Context) {
  if (shouldSkipComment(interpolationNode, commentState))
    return
  if (interpolationNode.content.type === NodeTypes.COMPOUND_EXPRESSION)
    return

  const expContent = interpolationNode.content.content
  if (!expContent || !existTargetOperator(expContent))
    return
  const expS = new MagicStringAST(expContent)
  transformScript(expContent, expS, ctx)
  if (expS.hasChanged()) {
    s.update(interpolationNode.content.loc.start.offset, interpolationNode.content.loc.end.offset, expS.toString())
    ctx.templateChange = true
  }
}
function handleElementProps(elementNode: ElementNode, commentState: CommentState, s: MagicStringAST, ctx: Context) {
  if (shouldSkipComment(elementNode, commentState))
    return
  if (!elementNode.props.length)
    return

  elementNode.props.forEach((prop) => {
    if (prop.type === NodeTypes.ATTRIBUTE)
      return
    if (!prop.exp || prop.exp.type === NodeTypes.COMPOUND_EXPRESSION)
      return

    const { loc } = prop.exp
    let isObjExpr = false
    let content = prop.exp.content
    if (!content || !existTargetOperator(content))
      return
    if (isBuiltInDirective(prop))
      return
    if (prop.exp.ast && isObjectExpression(prop.exp.ast)) {
      isObjExpr = true
      content = `${PATCH_DECLARATION}${content}`
    }

    const contentS = new MagicStringAST(content)
    transformScript(content, contentS, ctx)
    if (isObjExpr) {
      contentS.remove(0, PATCH_DECLARATION.length)
    }
    if (contentS.hasChanged()) {
      s.update(loc.start.offset, loc.end.offset, contentS.toString())
      ctx.templateChange = true
    }
  })
}

function isBuiltInDirective(prop: DirectiveNode) {
  return ['for', 'html', 'text'].includes(prop.name)
}

function existTargetOperator(content: string) {
  return OPERATOR_KEYS.some(key => content.includes(key))
}
function shouldSkipComment(child: TemplateChildNode, comment: CommentState, property: 'next' | 'block' = 'next') {
  return comment[property] && comment.line + 1 === child.loc.start.line
}
