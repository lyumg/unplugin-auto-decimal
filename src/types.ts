import type { NodePath } from '@babel/traverse'
import type { FilterPattern } from '@rollup/pluginutils'
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
  fromNewFunction?: boolean
  needImport?: boolean
  ownerPath?: NodePath
}
export interface ToDecimalConfig extends ToDecimalOptions {
  name?: string
}
export interface AutoDecimalOptions {
  /**
   * @desc 支持字符串数字
   */
  supportString?: boolean
  /**
   * @desc 是否启用末尾补 0 的形式
   *
   * 当启用后，只有计算表达式的最末端 “+0“ 才会转换
   */
  tailPatchZero?: boolean
  /**
   * @desc 高精度计算库
   *
   * @type {decimal.js | decimal.js-light | big.js}
   */
  package?: Package
  /**
   * @desc 启用 toDecimal 来显式转换计算表达式
   *
   * 启用后，只有计算表达式使用 .toDecimal() 时，才会转换。
   */
  toDecimal?: boolean | ToDecimalConfig
  /**
   * @desc 是否生成 dts 文件
   *
   * 当前项目中存在 typescript 时，默认生成
   */
  dts?: boolean | string
  /**
   * @desc 转换时，Decimal 实例的名称，避免命名冲突。
   *
   * @default __Decimal
   */
  decimalName?: string
  /**
   * @desc 支持 new Function 表达式
   *
   * 默认情况下，new Function 中的参数不会转换
   */
  supportNewFunction?: boolean | NewFunctionOptions
  /**
   * @desc 包含的文件
   * @default *.(cjs|mjs|js|ts|mts|jsx|tsx|vue)
   */
  includes?: FilterPattern
  /**
   * @desc 排除的文件
   * @default node_modules
   */
  excludes?: FilterPattern
}
export type InnerAutoDecimalOptions = Required<AutoDecimalOptions> & {
  ext: string
}
export interface ToDecimalOptions {
  /**
   * @desc 调用 Decimal 的方法，或者定义是否返回 decimal 实例
   * @alias cm
   * @type {toNumber | toString | toFixed | decimal}
   */
  callMethod?: CallMethod
  /**
   * @desc callMethod 别名
   */
  cm?: CallMethod
  /**
   * @desc 调用 Decimal 的 toFixed 方法时，需要保留的小数位数
   * @alias p
   * @type {number}
   */
  precision?: number
  /**
   * @desc precision 别名
   */
  p?: number
  /**
   * @desc 调用 Decimal 的 toFixed 方法时，使用的舍入模式
   * @alias rm
   * @type {RoundingModes | number}
   * @tutorial https://mikemcl.github.io/decimal.js/#modes
   */
  roundingModes?: RoundingModes | number
  /**
   * @desc roundingModes 别名
   */
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
export interface NewFunctionOptions {
  toDecimal?: boolean | ToDecimalConfig
  injectWindow?: string
}
type GetToDecimalReturn<T extends ToDecimalOptions, V extends 'callMethod' | 'cm'> = V extends keyof T
  ? T[V] extends 'toFixed' | 'toString'
    ? string
    : T[V] extends 'decimal'
    // @ts-expect-error support extend interface
      ? AutoDecimal['decimal']
      : number
  : never
