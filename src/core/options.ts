import type { AutoDecimalOptions, InnerAutoDecimalOptions, InnerToDecimalOptions, ToDecimalOptions } from '../types'
import { resolve } from 'node:path'
import process from 'node:process'
import { isPackageExists } from 'local-pkg'
import { DEFAULT_NEW_FUNCTION_CONFIG, DEFAULT_TO_DECIMAL_CONFIG } from './constant'

const rootPath = process.cwd()
const defaultOptions: InnerAutoDecimalOptions = {
  supportString: false,
  tailPatchZero: false,
  package: 'decimal.js-light',
  toDecimal: false,
  dts: isPackageExists('typescript'),
  supportNewFunction: false,
  decimalName: '__Decimal',
}
export function resolveOptions(rawOptions?: AutoDecimalOptions): InnerAutoDecimalOptions {
  const options = Object.assign({}, defaultOptions, rawOptions)
  options.dts = !options.dts
    ? false
    : resolve(rootPath, typeof options.dts === 'string' ? options.dts : 'auto-decimal.d.ts')
  options.toDecimal = !options.toDecimal
    ? false
    : typeof options.toDecimal === 'boolean'
      ? { ...DEFAULT_TO_DECIMAL_CONFIG }
      : Object.assign({}, DEFAULT_TO_DECIMAL_CONFIG, options.toDecimal)
  options.supportNewFunction = !options.supportNewFunction
    ? false
    : typeof options.supportNewFunction === 'boolean'
      ? { toDecimal: options.toDecimal }
      : {
          ...DEFAULT_NEW_FUNCTION_CONFIG,
          ...options.supportNewFunction,
        }
  return options
}
export function mergeToDecimalOptions(rawOptions: InnerToDecimalOptions, toDecimalOptions: ToDecimalOptions | boolean) {
  if (typeof toDecimalOptions === 'boolean') {
    return rawOptions
  }
  const precision = toDecimalOptions.precision ?? toDecimalOptions.p ?? rawOptions.precision
  const callMethod = toDecimalOptions.callMethod ?? toDecimalOptions.cm ?? rawOptions.callMethod
  const roundingModes = toDecimalOptions.roundingModes ?? toDecimalOptions.rm ?? rawOptions.roundingModes
  return Object.assign(rawOptions, {
    precision,
    callMethod,
    roundingModes,
    p: precision,
    cm: callMethod,
    rm: roundingModes,
  })
}
