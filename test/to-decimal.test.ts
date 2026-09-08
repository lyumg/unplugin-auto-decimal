/*
 * @Date: 2026-09-02 17:15:53
 * @Author: lyumg
 * @FilePath: /unplugin-auto-decimal/test/to-decimal.test.ts
 */
import { promises as fs } from 'node:fs'
import { resolve } from 'node:path'
import fastGlob from 'fast-glob'
import { describe, expect, it } from 'vitest'
import { Context } from '../src/core/context'

describe('transform to decimal', async () => {
  const root = resolve(__dirname, 'fixtures/to-decimal')
  const files = await fastGlob('*.ts', {
    cwd: root,
    onlyFiles: true,
  })
  for (const file of files) {
    const fixture = await fs.readFile(resolve(root, file), 'utf-8')
    const ctx = new Context(file, {
      supportString: false,
      tailPatchZero: false,
      package: 'decimal.js-light',
      toDecimal: true,
      dts: false,
      decimalName: '__Decimal',
      supportNewFunction: false,
    })
    const transformedCode = ctx.transform(fixture)?.code ?? fixture
    it(`
      ts
      input:
        const _a = 0.1 + 0.2.toDecimal()
      output:
        const _a = new __Decimal(0.1).plus(0.2).toNumber()
      `, () => {
      expect(transformedCode).toMatch('const _a = new __Decimal(0.1).plus(0.2).toNumber()')
    })
    it(`
      ts _test()
      input:
        function _test() {
          const _ad = 0.111 + 0.222.toDecimal({ precision: 3, callMethod: 'toFixed' })
        }
      output:
        function _test() {
          const _ad = new __Decimal(0.111).plus(0.222)[\'toFixed\'](3, 4)
        }
      `, () => {
      expect(transformedCode).toMatch('const _ad = new __Decimal(0.111).plus(0.222)[\'toFixed\'](3, 4)')
    })
    it(`
      ts Class
      input:
        constructor() {
          this.block = 0.1 + 0.2.toDecimal()
        }
      output:
         constructor() {
          this.block = new __Decimal(0.1).plus(0.2).toNumber()
        }
      `, () => {
      expect(transformedCode).toMatch('this.block = new __Decimal(0.1).plus(0.2).toNumber()')
    })
    it(`
      ts Array
      input:
        const _arr = [0, 0.1 + 0.2.toDecimal({ callMethod: 'toString' }), 3]
      output:
        const _arr = [0, new __Decimal(0.1).plus(0.2)[\'toString\'](), 3]
      `, () => {
      expect(transformedCode).toMatch('const _arr = [0, new __Decimal(0.1).plus(0.2)[\'toString\'](), 3]')
    })
    it(`
      ts return decimal
      input:
        const _toDecimal = (0.111 + 0.222).toDecimal({ callMethod: 'decimal' })
      output:
        const _toDecimal = new __Decimal(0.111).plus(0.222)
      `, () => {
      expect(transformedCode).toMatch('const _toDecimal = new __Decimal(0.111).plus(0.222)')
    })
  }
})
