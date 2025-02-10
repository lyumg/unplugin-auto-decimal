import type { MagicStringAST } from 'magic-string-ast'
import type { BIG_RM, DECIMAL_RM, DECIMAL_RM_LIGHT } from './core/rounding-modes'

export interface Options {
  shouldSkip: boolean
  msa: MagicStringAST
  imported: boolean
  decimalPkgName: string
  initial: boolean
  callMethod: CallMethod
  callArgs: string
  autoDecimalOptions: InnerAutoDecimalOptions
}
export interface ToDecimalConfig extends ToDecimalOptions {
  name?: string
}
export interface AutoDecimalOptions {
  supportString?: boolean
  tailPatchZero?: boolean
  package?: Package
  toDecimal?: boolean | ToDecimalConfig
  dts?: boolean | string
}
export type InnerAutoDecimalOptions = Required<AutoDecimalOptions>
export interface ToDecimalOptions {
  callMethod?: CallMethod
  precision?: number
  roundingModes?: RoundingModes | number
}
export type InnerToDecimalOptions = Required<ToDecimalConfig>
export type ToDecimal = <T extends ToDecimalOptions>(options?: T) => ToDecimalReturn<T>
export interface Extra {
  __extra: Record<string, unknown>
  options: Options
  __shouldTransform: boolean
}
export interface AutoDecimal { }

export type CallMethod = 'toNumber' | 'toString' | 'toFixed'
export type Package = 'decimal.js' | 'decimal.js-light' | 'big.js'
export type ToDecimalReturn<T> = T extends ToDecimalOptions
  ? T['callMethod'] extends 'toFixed' | 'toString'
    ? string
    : number
  : number
export type RoundingModes = AutoDecimal extends { package: 'big.js' }
  ? BigRoundingMode
  : AutoDecimal extends { package: 'decimal.js' }
    ? DecimalRoundingMode
    : DecimalLightRoundingMode
export type DecimalRoundingMode = keyof typeof DECIMAL_RM
export type DecimalLightRoundingMode = keyof typeof DECIMAL_RM_LIGHT
export type BigRoundingMode = keyof typeof BIG_RM
export type Operator = '+' | '-' | '*' | '/'
export interface CommentState {
  line: number
  block: boolean
  next: boolean
}
