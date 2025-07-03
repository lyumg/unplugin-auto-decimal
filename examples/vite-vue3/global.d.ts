export { }

declare module 'unplugin-auto-decimal/types' {
  interface AutoDecimal{
    decimal: import('decimal.js-light').Decimal
  }
}