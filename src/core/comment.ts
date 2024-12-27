import type { NodePath } from '@babel/traverse'
import type { Comment } from '@babel/types'
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
export function innerComment(path: NodePath, igc: string | string[] = [NEXT_COMMENT, BLOCK_COMMENT]) {
  skipAutoDecimalComment(path, igc, true)
}
function skipAutoDecimalComment(path: NodePath, igc: string | string[], isJSX = false) {
  let comments: Comment[] | undefined
  let startLine = -1
  const rawPath = path
  if (isJSX) {
    if (isJSXOpeningElement(path.node)) {
      path = path.parentPath!
      startLine = path.node.loc?.start.line ?? -1
    }
    else if (isJSXExpressionContainer(path.node)) {
      startLine = path.node.expression.loc?.start.line ?? -1
    }
    let prevPath = path.getPrevSibling()
    if (!prevPath.node)
      return
    while ((!isJSXExpressionContainer(prevPath.node) || !isJSXEmptyExpression(prevPath.node.expression)) || startLine !== -1) {
      if (startLine !== -1 && isJSXExpressionContainer(prevPath.node)) {
        if (isJSXEmptyExpression(prevPath.node.expression))
          break
        const exprStartLine = prevPath.node.loc?.start.line ?? 0
        if (exprStartLine !== startLine) {
          startLine = 0
          break
        }
      }
      prevPath = prevPath.getPrevSibling()
      if (!prevPath.node || isJSXElement(prevPath.node)) {
        if (isJSXElement(prevPath.node)) {
          const jsxElementStartLine = prevPath.node.loc?.start.line ?? 0
          if (startLine === jsxElementStartLine) {
            continue
          }
        }
        return
      }
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

  const ignoreComment = Array.isArray(igc) ? igc : [igc]
  if (!comments)
    return
  const isIgnore = comments.some(comment => ignoreComment.some(ig => comment.value.includes(ig))) ?? false
  if (isIgnore) {
    rawPath.skip()
  }
}
