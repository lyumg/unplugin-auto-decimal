import type { MagicStringAST } from 'magic-string-ast'

export interface Options {
  shouldSkip: boolean
  msa: MagicStringAST
  imported: boolean
  decimalPkgName: string
  initial: boolean
  isOwnBinaryExpression?: boolean
  autoDecimalOptions?: AutoDecimalOptions
}

export interface CommentState {
  line: number
  block: boolean
  next: boolean
}

export interface AutoDecimalOptions {
  supportString?: boolean
  tailPatchZero?: boolean
  package?: 'decimal.js' | 'decimal.js-light' | 'big.js'
}
export type Operator = '+' | '-' | '*' | '/'
