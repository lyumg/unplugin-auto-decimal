import type {
  AutoDecimalOptions,
  InnerAutoDecimalOptions,
  InnerToDecimalOptions,
  ToDecimalConfig,
  ToDecimalOptions,
} from '../types'
import { resolve } from 'node:path'
import process from 'node:process'
import { isPackageExists } from 'local-pkg'
import {
  DECIMAL_PKG_NAME,
  DEFAULT_NEW_FUNCTION_CONFIG,
  DEFAULT_TO_DECIMAL_CONFIG,
} from './constant'
/*
 * @Date: 2026-09-02 17:23:25
 * @Author: lyumg
 * @FilePath: /unplugin-auto-decimal/src/core/options.ts
 */
const rootPath = process.cwd()
const defaultOptions: AutoDecimalOptions = {
  supportString: false,
  tailPatchZero: false,
  package: 'decimal.js-light',
  toDecimal: false,
  dts: isPackageExists('typescript'),
  decorator: false,
  supportNewFunction: false,
  decimalName: DECIMAL_PKG_NAME,
}
export function resolveOptions(rawOptions?: AutoDecimalOptions): InnerAutoDecimalOptions {
  const options = Object.assign({}, defaultOptions, rawOptions)
  options.toDecimal = !options.toDecimal
    ? false
    : options.toDecimal === true
      ? { ...DEFAULT_TO_DECIMAL_CONFIG }
      : mergeToDecimalOptions(DEFAULT_TO_DECIMAL_CONFIG, options.toDecimal)
  options.supportNewFunction = !options.supportNewFunction
    ? false
    : options.supportNewFunction === true
      ? { toDecimal: options.toDecimal }
      : {
          ...DEFAULT_NEW_FUNCTION_CONFIG,
          ...options.supportNewFunction,
          toDecimal: options.supportNewFunction.toDecimal || options.toDecimal
            ? mergeToDecimalOptions(
                (options.toDecimal || DEFAULT_TO_DECIMAL_CONFIG) as Required<ToDecimalConfig>,
                options.supportNewFunction.toDecimal as ToDecimalOptions,
              )
            : false,
        }

  options.dts = (!options.toDecimal || !options.dts)
    ? false
    : resolve(rootPath, typeof options.dts === 'string' ? options.dts : 'auto-decimal.d.ts')
  return options as InnerAutoDecimalOptions
}
export function mergeToDecimalOptions(rawOptions: InnerToDecimalOptions, toDecimalOptions: ToDecimalOptions | boolean) {
  if (!toDecimalOptions || typeof toDecimalOptions === 'boolean') {
    return rawOptions
  }
  const precision = toDecimalOptions.precision ?? toDecimalOptions.p ?? rawOptions.precision
  const callMethod = toDecimalOptions.callMethod ?? toDecimalOptions.cm ?? rawOptions.callMethod
  const roundingModes = toDecimalOptions.roundingModes ?? toDecimalOptions.rm ?? rawOptions.roundingModes
  return Object.assign({}, rawOptions, {
    ...toDecimalOptions,
    precision,
    callMethod,
    roundingModes,
    p: precision,
    cm: callMethod,
    rm: roundingModes,
  })
}
