import type { AutoDecimalOptions, InnerAutoDecimalOptions, ToDecimalOptions } from '../types'
import { extname } from 'node:path'
import { DECIMAL_PKG_NAME } from './constant'
import { generateDeclaration } from './generate'
import { resolveOptions } from './options'
import transformer from './transformer'

/*
 * @Date: 2026-09-02 14:23:08
 * @Author: lyumg
 * @FilePath: /unplugin-auto-decimal/src/core/context.ts
 */
export class Context {
  private _options: string
  options: InnerAutoDecimalOptions
  imported = false
  decimalPkgName = DECIMAL_PKG_NAME
  callCode = 'toNumber()'
  callDecimal = false
  needImport = false
  internal = false
  templateChange = false
  hasExportDefault = false
  ext = ''
  id = ''
  constructor(id: string, rawOptions: AutoDecimalOptions) {
    const options = resolveOptions(rawOptions)
    this.decimalPkgName = options.decimalName || DECIMAL_PKG_NAME
    this.ext = extname(id)
    this.id = id
    this.options = options
    this._options = JSON.stringify(options)

    if (options.dts) {
      generateDeclaration(options)
    }
  }

  reset() {
    this.callCode = 'toNumber()'
    this.callDecimal = false
    this.hasExportDefault = false
    this.options = JSON.parse(this._options)
  }

  setToDecimalOptions(options: ToDecimalOptions) {
    this.options.toDecimal = options
  }

  transform(code: string) {
    return transformer(this)(code)
  }
}
