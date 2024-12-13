import traverse from '@babel/traverse'
import { parse } from '@babel/parser'
import { parse as vueParse } from '@vue/compiler-sfc'
import { NodeTypes } from '@vue/compiler-core'
import { MagicStringAST } from 'magic-string-ast'
import type { SFCScriptBlock } from '@vue/compiler-sfc'
import type {
  AttributeNode,
  CommentNode,
  CompoundExpressionNode,
  DirectiveNode,
  ElementNode,
  ForNode,
  IfBranchNode,
  InterpolationNode,
  TemplateChildNode,
} from '@vue/compiler-core'
import type { TraverseOptions } from 'babel__traverse'
import type { AutoDecimalOptions, CommentState, Options } from '../types'
import { traverseAst } from './traverse'
import { BLOCK_COMMENT, DECIMAL_PKG_NAME, NEXT_COMMENT, OPERATOR_KEYS, PKG_NAME } from './constant'

export function transformAutoDecimal(code: string, autoDecimalOptions?: AutoDecimalOptions) {
  const { msa } = getTransformed(code, traverseAst, autoDecimalOptions)
  return msa
}
export function transformVueAutoDecimal(code: string, autoDecimalOptions?: AutoDecimalOptions) {
  const sfcAst = vueParse(code)
  const { descriptor } = sfcAst
  const { script, scriptSetup, template } = descriptor
  const msa = new MagicStringAST(code)
  if (template) {
    const { ast, attrs = {} } = template
    if (!attrs['ad-ignore'] && ast?.children) {
      parserTemplate(msa, ast.children)
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
  autoDecimalOptions?: AutoDecimalOptions,
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
    shouldSkip: false,
  }
  // @ts-expect-error adapter cjs/esm
  const babelTraverse = traverse.default ?? traverse
  babelTraverse(ast, traverseOptions(options))
  return options
}
function isBuiltInDirective(prop: DirectiveNode | AttributeNode) {
  return prop.type === NodeTypes.DIRECTIVE && !['for', 'html', 'text'].includes(prop.name)
}
function canParserProp(prop: DirectiveNode | AttributeNode) {
  return prop.type !== NodeTypes.DIRECTIVE || isBuiltInDirective(prop)
}
function existTargetOperator(content: string) {
  return OPERATOR_KEYS.some(key => content.includes(key))
}
function shouldSkipComment(comment: CommentState, child: TemplateChildNode, property: 'next' | 'block' = 'next') {
  return comment[property] && comment.line + 1 === child.loc.start.line
}
function parserTemplate(msa: MagicStringAST, children: TemplateChildNode[]) {
  const commentState: CommentState = { line: 0, block: false, next: false }
  children.forEach((child) => {
    if (child.type === NodeTypes.TEXT)
      return
    if (child.type === NodeTypes.COMMENT) {
      updateCommentState(commentState, child)
      return
    }
    if (shouldSkipComment(commentState, child, 'block'))
      return

    switch (child.type) {
      case NodeTypes.INTERPOLATION:
        handleInterpolation(msa, child, commentState)
        break
      case NodeTypes.ELEMENT:
        handleElementProps(msa, child, commentState)
        break
      default:
        break
    }
    if (hasChildrenNode(child) && child.children) {
      parserTemplate(msa, child.children as TemplateChildNode[])
    }
  })
}
function hasChildrenNode(
  child: TemplateChildNode,
): child is ElementNode | CompoundExpressionNode | IfBranchNode | ForNode {
  const nodeTypes = [NodeTypes.ELEMENT, NodeTypes.COMPOUND_EXPRESSION, NodeTypes.IF_BRANCH, NodeTypes.FOR]
  return nodeTypes.includes(child.type)
}
function updateCommentState(commentState: CommentState, commentNode: CommentNode) {
  commentState.line = commentNode.loc.start.line
  commentState.block = commentNode.content.includes(BLOCK_COMMENT)
  commentState.next = commentNode.content.includes(NEXT_COMMENT)
}
function handleInterpolation(msa: MagicStringAST, interpolationNode: InterpolationNode, commentState: CommentState) {
  if (shouldSkipComment(commentState, interpolationNode))
    return
  if (interpolationNode.content.type === NodeTypes.COMPOUND_EXPRESSION)
    return

  const expContent = interpolationNode.content.content
  if (!expContent || !existTargetOperator(expContent))
    return

  const { msa: transformedMsa } = getTransformed(expContent, options => traverseAst(options, false))

  msa.update(interpolationNode.content.loc.start.offset, interpolationNode.content.loc.end.offset, transformedMsa.toString())
}
function handleElementProps(msa: MagicStringAST, elementNode: ElementNode, commentState: CommentState) {
  if (shouldSkipComment(commentState, elementNode))
    return
  if (!elementNode.props.length)
    return

  elementNode.props.forEach((prop) => {
    if (prop.type === NodeTypes.ATTRIBUTE)
      return
    if (!prop.exp || prop.exp.type === NodeTypes.COMPOUND_EXPRESSION)
      return

    const { content, loc } = prop.exp
    if (!content || !existTargetOperator(content))
      return
    if (!canParserProp(prop))
      return

    const { msa: transformedMsa } = getTransformed(content, options => traverseAst(options, false))

    msa.update(loc.start.offset, loc.end.offset, transformedMsa.toString())
  })
}
