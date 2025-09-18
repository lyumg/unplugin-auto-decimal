import type { InnerToDecimalOptions } from '../types'

export const PREFIX = 'ad'
export const BASE_COMMENT = `${PREFIX}-ignore`
export const NEXT_COMMENT = `next-${BASE_COMMENT}`
export const FILE_COMMENT = `file-${BASE_COMMENT}`
export const BLOCK_COMMENT = `block-${BASE_COMMENT}`
export const COMMENTS = [BASE_COMMENT, NEXT_COMMENT]
export const PATCH_DECLARATION = 'const __PATCH_DECLARATION__ = '
export const RETURN_DECLARATION_CODE = '###code###'
export const RETURN_FUNCTION_NAME = '__RETURN_DECLARATION_FN__'
export const RETURN_DECLARATION_PREFIX = `function ${RETURN_FUNCTION_NAME}() {`
export const RETURN_DECLARATION_FN = `${RETURN_DECLARATION_PREFIX}${RETURN_DECLARATION_CODE}}`
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
export const DEFAULT_NEW_FUNCTION_CONFIG = {
  injectWindow: undefined,
  toDecimal: false,
} as const
export const DECIMAL_RM_LIGHT = Object.freeze({
  ROUND_UP: 0,
  ROUND_DOWN: 1,
  ROUND_CEIL: 2,
  ROUND_FLOOR: 3,
  ROUND_HALF_UP: 4,
  ROUND_HALF_DOWN: 5,
  ROUND_HALF_EVEN: 6,
  ROUND_HALF_CEIL: 7,
  ROUND_HALF_FLOOR: 8,
})
export const DECIMAL_RM = Object.freeze({
  ...DECIMAL_RM_LIGHT,
  EUCLID: 9,
})
export const BIG_RM = Object.freeze({
  ROUND_DOWN: 0,
  ROUND_HALF_UP: 1,
  ROUND_HALF_DOWN: 2,
  ROUND_UP: 3,
})
