import { resolve } from 'node:path'
import process from 'node:process'
import { isPackageExists } from 'local-pkg'
import type { AutoDecimalOptions, InnerAutoDecimalOptions } from '../types'
import { DEFAULT_TO_DECIMAL_CONFIG } from './constant'

const rootPath = process.cwd()
const defaultOptions: InnerAutoDecimalOptions = {
  supportString: false,
  tailPatchZero: false,
  package: 'decimal.js-light',
  toDecimal: false,
  dts: isPackageExists('typescript'),
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
  return options
}
