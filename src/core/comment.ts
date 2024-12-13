import type { NodePath } from '@babel/traverse'
import { BASE_COMMENT, BLOCK_COMMENT, NEXT_COMMENT } from './constant'

export function getComments(path: NodePath) {
  const leadingComments = path.node.leadingComments ?? []
  const trailingComments = path.node.trailingComments ?? []
  const currentLineComments = trailingComments.filter((comment) => {
    return comment.loc?.start.line === path.node.loc?.start.line && comment.value.includes(BASE_COMMENT)
  })
  return [...leadingComments, ...currentLineComments]
}
export function blockComment(path: NodePath) {
  skipAutoDecimalComment(path, BLOCK_COMMENT)
}
export function nextComment(path: NodePath) {
  skipAutoDecimalComment(path, NEXT_COMMENT)
}
export function innerComment(path: NodePath, igc = NEXT_COMMENT) {
  skipAutoDecimalComment(path, igc, true)
}
function skipAutoDecimalComment(path: NodePath, igc: string, isJSX = false) {
  let comments
  const rawPath = path
  if (isJSX) {
    if (path.node.type === 'JSXOpeningElement') {
      path = path.parentPath!
    }
    let prevPath = path.getPrevSibling()
    if (!prevPath.node)
      return
    while (prevPath.type !== 'JSXExpressionContainer') {
      prevPath = prevPath.getPrevSibling()
      if (!prevPath.node || prevPath.node.type === 'JSXElement')
        return
    }
    if (prevPath.node.type !== 'JSXExpressionContainer')
      return
    const { expression } = prevPath.node
    if (expression.type === 'JSXEmptyExpression') {
      comments = expression.innerComments ?? []
    }
  }
  else {
    comments = getComments(path)
  }
  const isIgnore = comments?.some(comment => comment.value.includes(igc)) ?? false
  if (isIgnore) {
    rawPath.skip()
  }
}
