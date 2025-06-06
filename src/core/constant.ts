import type { InnerToDecimalOptions } from '../types'

export const PREFIX = 'ad'
export const BASE_COMMENT = `${PREFIX}-ignore`
export const NEXT_COMMENT = `next-${BASE_COMMENT}`
export const FILE_COMMENT = `file-${BASE_COMMENT}`
export const BLOCK_COMMENT = `block-${BASE_COMMENT}`
export const COMMENTS = [BASE_COMMENT, NEXT_COMMENT]
export const PATCH_DECLARATION = 'const __PATCH_DECLARATION__ = '
export const LITERALS = ['StringLiteral', 'NullLiteral', 'BooleanLiteral', 'TemplateLiteral']
export const OPERATOR = {
  '+': 'plus',
  '-': 'minus',
  '*': 'times',
  '/': 'div',
  '**': 'pow',
}

export const OPERATOR_KEYS = Object.keys(OPERATOR)
export const REGEX_SUPPORTED_EXT = /\.([cm]?[jt]s)x?$/
export const REGEX_VUE = [/\.vue$/, /\.vue\?vue/, /\.vue\?v=/]
export const REGEX_NODE_MODULES = /node_modules/
export const DECIMAL_PKG_NAME = '__Decimal'
export const PKG_NAME = 'decimal.js-light'
export const DEFAULT_TO_DECIMAL_CONFIG: InnerToDecimalOptions = {
  precision: 2,
  p: 2,
  roundingModes: 'ROUND_HALF_UP',
  rm: 'ROUND_HALF_UP',
  callMethod: 'toNumber',
  cm: 'toNumber',
  name: 'toDecimal',
}
