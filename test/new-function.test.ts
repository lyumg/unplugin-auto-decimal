import { promises as fs } from 'node:fs'
import { resolve } from 'node:path'
import fastGlob from 'fast-glob'
import { describe, expect, it } from 'vitest'
import { transform } from '../src/core/unplugin'

describe('transform', async () => {
  const root = resolve(__dirname, 'fixtures')
  const files = await fastGlob('*-function.ts', {
    cwd: root,
    onlyFiles: true,
  })
  for (const file of files) {
    const fixture = await fs.readFile(resolve(root, file), 'utf-8')
    const transformedCode = transform(fixture, file, {
      supportString: true,
      tailPatchZero: false,
      package: 'decimal.js-light',
      toDecimal: false,
      dts: false,
      decimalName: '__Decimal',
      supportNewFunction: true,
    })?.code ?? fixture
    it(`
      new Function return value
      input:
        const fn = new Function('a', 'b', \`return a + b\`)
        const result = fn(0.1, 0.2)
      output:
        const fn = new Function('a', 'b', '__Decimal', \`return new __Decimal(a).plus(b).toNumber()\`)
        const result = fn(0.1, 0.2, __Decimal)
      `, () => {
      expect(transformedCode).toMatch(`const fn = new Function('a', 'b', '__Decimal', \`return new __Decimal(a).plus(b).toNumber()\`)`)
      expect(transformedCode).toMatch(`const result = fn(0.1, 0.2, __Decimal)`)
    })
    it(`
      new Function params
      input:
        const result = fn(0.1, 0.2)
      output:
        const result = fn(0.1, 0.2, __Decimal)
      `, () => {
      expect(transformedCode).toMatch('const result = fn(0.1, 0.2, __Decimal)')
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
