/*
 * @Date: 2026-09-02 17:15:53
 * @Author: lyumg
 * @FilePath: /unplugin-auto-decimal/test/new-function-to-decimal.test.ts
 */
import { promises as fs } from 'node:fs'
import { resolve } from 'node:path'
import fastGlob from 'fast-glob'
import { describe, expect, it } from 'vitest'
import { Context } from '../src/core/context'
import { resolveOptions } from '../src/core/options'

describe('transform new function to decimal', async () => {
  const root = resolve(__dirname, 'fixtures/new-function')
  const files = await fastGlob('*to-decimal.ts', {
    cwd: root,
    onlyFiles: true,
  })
  for (const file of files) {
    const fixture = await fs.readFile(resolve(root, file), 'utf-8')
    const ctx = new Context(file, resolveOptions({
      supportString: true,
      tailPatchZero: false,
      package: 'decimal.js-light',
      toDecimal: true,
      dts: false,
      decimalName: '__Decimal',
      supportNewFunction: true,
    }))
    const transformedCode = ctx.transform(fixture)?.code ?? fixture
    it(`
      new Function toDecimal
      input:
        const returnedValue = () => 'return a + b + 3'
      output:
        const returnedValue = () => 'return a + b + 3'
      `, () => {
      expect(transformedCode).toMatch(`const returnedValue = () => 'return a + b + 3'`)
    })
    it(`
      new Function toDecimal
      input:
        return 'return a + b + 4..toDecimal()'
      output:
        return 'return new __Decimal(a).plus(b).plus(4.).toNumber()'
      `, () => {
      expect(transformedCode).toMatch(`return 'return new __Decimal(a).plus(b).plus(4.).toNumber()'`)
    })
    it(`
      new Function Array
      input:
        const arr = [1, new Function('a', 'b', params)]
        arr[1](0.1, 0.2)
      output:
        const arr = [1, new Function('a', 'b', '__Decimal', params)]
        arr[1](0.1, 0.2, __Decimal)
      `, () => {
      expect(transformedCode).toMatch(`const arr = [1, new Function('a', 'b', '__Decimal', params)]`)
      expect(transformedCode).toMatch(`arr[1](0.1, 0.2, __Decimal)`)
    })
    it(`
      new Function Object
      input:
        const obj = { b: new Function('a', 'b', params) }
        obj.b(num, 0.2))
      output:
        const obj = { b: new Function('a', 'b', '__Decimal', params) }
        obj.b(num, 0.2, __Decimal))
      `, () => {
      expect(transformedCode).toMatch(`const obj = { b: new Function('a', 'b', '__Decimal', params) }`)
      expect(transformedCode).toMatch(`obj.b(num, 0.2, __Decimal))`)
    })
    it(`
      new Function Call Function
      input:
        const callFn = fn(num, 0.2)
      output:
        const callFn = fn(num, 0.2, __Decimal)
      `, () => {
      expect(transformedCode).toMatch(`const callFn = fn(num, 0.2, __Decimal)`)
    })
  }
})
