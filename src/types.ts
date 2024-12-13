import type { FilterPattern } from 'vite'
import type { MagicStringAST } from 'magic-string-ast'

export interface Options {
  shouldSkip: boolean
  msa: MagicStringAST
  imported: boolean
  autoDecimalOptions?: AutoDecimalOptions
}

export interface CommentState {
  line: number
  block: boolean
  next: boolean
}

export interface AutoDecimalOptions {
  supportString?: boolean
}

type Overwrite<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U

export type OptionsResolved = Overwrite<
  Required<AutoDecimalOptions>,
  Pick<AutoDecimalOptions, 'supportString'>
>
export type Operator = '+' | '-' | '*' | '/'
