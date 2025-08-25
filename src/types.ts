import type { MagicStringAST } from 'magic-string-ast'
import type { BIG_RM, DECIMAL_RM, DECIMAL_RM_LIGHT } from './core/constant'

export interface AutoDecimal {}
export interface Options {
  shouldSkip: boolean
  msa: MagicStringAST
  imported: boolean
  decimalPkgName: string
  initial: boolean
  callMethod: CallMethod
  callArgs: string
  autoDecimalOptions: InnerAutoDecimalOptions
  integer: boolean
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
  decimalName?: string
  supportNewFunction?: boolean | {
    toDecimal: false
  }
}
export type InnerAutoDecimalOptions = Required<AutoDecimalOptions>
export interface ToDecimalOptions {
  callMethod?: CallMethod
  /** callMethod */
  cm?: CallMethod
  precision?: number
  /** precision */
  p?: number
  roundingModes?: RoundingModes | number
  /** roundingModes */
  rm?: RoundingModes | number
}
export type InnerToDecimalOptions = Required<ToDecimalConfig>
export type ToDecimal = <T extends ToDecimalOptions>(options?: T) => ToDecimalReturn<T>
export interface Extra {
  __extra: Record<string, unknown>
  options: Options
  __shouldTransform: boolean
}

export type CallMethod = 'toNumber' | 'toString' | 'toFixed' | 'decimal'
export type Package = 'decimal.js' | 'decimal.js-light' | 'big.js'
export type ToDecimalReturn<T extends ToDecimalOptions> = GetToDecimalReturn<T, 'callMethod'> | GetToDecimalReturn<T, 'cm'>
// @ts-expect-error support extend
export type RoundingModes = AutoDecimal['package'] extends 'big.js'
  ? BigRoundingMode
  // @ts-expect-error support extend
  : AutoDecimal['package'] extends 'decimal.js'
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
type GetToDecimalReturn<T extends ToDecimalOptions, V extends 'callMethod' | 'cm'> = V extends keyof T
  ? T[V] extends 'toFixed' | 'toString'
    ? string
    : T[V] extends 'decimal'
    // @ts-expect-error support extend interface
      ? AutoDecimal['decimal']
      : number
  : never
