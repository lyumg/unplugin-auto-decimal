export const PREFIX = 'ad'
export const BASE_COMMENT = `${PREFIX}-ignore`
export const NEXT_COMMENT = `next-${BASE_COMMENT}`
export const FILE_COMMENT = `file-${BASE_COMMENT}`
export const BLOCK_COMMENT = `block-${BASE_COMMENT}`
export const COMMENTS = [BASE_COMMENT, NEXT_COMMENT]
export const LITERALS = ['StringLiteral', 'NullLiteral', 'BooleanLiteral', 'TemplateLiteral']
export const OPERATOR = {
  '+': 'add',
  '/': 'div',
  '-': 'sub',
  '*': 'mul',
}

export const OPERATOR_KEYS = Object.keys(OPERATOR)
export const REGEX_SUPPORTED_EXT = /\.([cm]?[jt]s)x?$/
export const REGEX_VUE = [/\.vue$/, /\.vue\?vue/, /\.vue\?v=/]
export const REGEX_NODE_MODULES = /node_modules/
export const DECIMAL_PKG_NAME = '__Decimal'
export const PKG_NAME = 'decimal.js-light'
