import traverse from '@babel/traverse'
import { parse } from '@babel/parser'
import { parse as vueParse } from '@vue/compiler-sfc'
import { NodeTypes } from '@vue/compiler-core'
import { MagicStringAST } from 'magic-string-ast'
import type { SFCScriptBlock } from '@vue/compiler-sfc'
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
import type { TraverseOptions } from '@babel/traverse'
import { isObjectExpression } from '@babel/types'
import type { CommentState, InnerAutoDecimalOptions, Options } from '../types'
import { handleImportDeclaration, traverseAst } from './traverse'
import { BLOCK_COMMENT, DECIMAL_PKG_NAME, NEXT_COMMENT, OPERATOR_KEYS, PATCH_DECLARATION, PKG_NAME } from './constant'

export function transformAutoDecimal(code: string, autoDecimalOptions: InnerAutoDecimalOptions) {
  const { msa } = getTransformed(code, traverseAst, autoDecimalOptions)
  return msa
}
export function transformVueAutoDecimal(code: string, autoDecimalOptions: InnerAutoDecimalOptions) {
  const sfcAst = vueParse(code)
  const { descriptor } = sfcAst
  const { script, scriptSetup, template } = descriptor
  const msa = new MagicStringAST(code)

  const getDecimalPkgName = (scriptSection: SFCScriptBlock | null) => {
    if (!scriptSection)
      return DECIMAL_PKG_NAME
    const { decimalPkgName } = getTransformed(
      scriptSection.content,
      options => ({
        ImportDeclaration: path => handleImportDeclaration(path, options),
      }),
      autoDecimalOptions,
    )
    return decimalPkgName
  }
  let decimalPkgName = getDecimalPkgName(scriptSetup)
  if (!decimalPkgName) {
    decimalPkgName = getDecimalPkgName(script)
  }

  function parserTemplate(children: TemplateChildNode[]) {
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
          handleInterpolation(child, commentState)
          break
        case NodeTypes.ELEMENT:
          handleElementProps(child, commentState)
          break
        default:
          break
      }
      if (hasChildrenNode(child) && child.children) {
        parserTemplate(child.children as TemplateChildNode[])
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
  function handleInterpolation(interpolationNode: InterpolationNode, commentState: CommentState) {
    if (shouldSkipComment(interpolationNode, commentState))
      return
    if (interpolationNode.content.type === NodeTypes.COMPOUND_EXPRESSION)
      return

    const expContent = interpolationNode.content.content
    if (!expContent || !existTargetOperator(expContent))
      return

    const { msa: transformedMsa } = getTransformed(
      expContent,
      options => traverseAst({ ...options, decimalPkgName }, false),
      autoDecimalOptions,
    )

    msa.update(interpolationNode.content.loc.start.offset, interpolationNode.content.loc.end.offset, transformedMsa.toString())
  }
  function handleElementProps(elementNode: ElementNode, commentState: CommentState) {
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
      const { msa: transformedMsa } = getTransformed(
        content,
        options => traverseAst({ ...options, decimalPkgName }, false),
        autoDecimalOptions,
      )
      if (isObjExpr) {
        transformedMsa.remove(0, PATCH_DECLARATION.length)
      }
      msa.update(loc.start.offset, loc.end.offset, transformedMsa.toString())
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
  if (template) {
    const { ast, attrs = {} } = template
    if (!attrs['ad-ignore'] && ast?.children) {
      parserTemplate(ast.children)
    }
  }
  let needsImport = msa.hasChanged()
  const parseScript = (scriptSection: SFCScriptBlock | null) => {
    if (!scriptSection)
      return
    const { start, end } = scriptSection.loc
    const { msa: transformedMsa, imported } = getTransformed(
      scriptSection.content,
      options => traverseAst(options, true, needsImport),
      autoDecimalOptions,
    )
    if (needsImport) {
      needsImport = !imported
    }
    msa.update(start.offset, end.offset, transformedMsa.toString())
  }
  parseScript(scriptSetup)
  parseScript(script)
  if (needsImport) {
    msa.append(`
<script>
  import ${DECIMAL_PKG_NAME} from '${PKG_NAME}';
  export default {
    data() {
      this.${DECIMAL_PKG_NAME} = ${DECIMAL_PKG_NAME};
    }
  }
</script>
    `)
  }

  return msa
}
export function getTransformed(
  code: string,
  traverseOptions: (options: Options) => TraverseOptions,
  autoDecimalOptions: InnerAutoDecimalOptions,
) {
  const ast = parse(code, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
  })
  const msa = new MagicStringAST(code)
  const options: Options = {
    autoDecimalOptions,
    imported: false,
    msa,
    decimalPkgName: DECIMAL_PKG_NAME,
    initial: false,
    shouldSkip: false,
    callArgs: '()',
    callMethod: 'toNumber',
  }
  // @ts-expect-error adapter cjs/esm
  const babelTraverse = traverse.default ?? traverse
  babelTraverse(ast, traverseOptions(options))
  return options
}
