import type { NodePath } from '@babel/traverse'
import { isJSXElement, isJSXEmptyExpression, isJSXExpressionContainer, isJSXOpeningElement } from '@babel/types'
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
    if (isJSXOpeningElement(path.node)) {
      path = path.parentPath!
    }
    let prevPath = path.getPrevSibling()
    if (!prevPath.node)
      return
    while (!isJSXExpressionContainer(prevPath.node)) {
      prevPath = prevPath.getPrevSibling()
      if (!prevPath.node || isJSXElement(prevPath.node))
        return
    }
    if (!isJSXExpressionContainer(prevPath.node))
      return
    const { expression } = prevPath.node
    if (isJSXEmptyExpression(expression)) {
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
