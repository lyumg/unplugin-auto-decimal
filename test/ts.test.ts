import { promises as fs } from 'node:fs'
import { resolve } from 'node:path'
import fastGlob from 'fast-glob'
import { describe, expect, it } from 'vitest'
import { transform } from '../src/core/unplugin'

describe('transform', async () => {
  const root = resolve(__dirname, 'fixtures')
  const files = await fastGlob(['*.ts', '!*function.ts', '!*to-decimal.ts'], {
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
      supportNewFunction: false,
    })?.code ?? fixture
    it(`
      ts
      input:
        const _a = 0.1 + 0.2
      output:
        const _a = new __Decimal(0.1).plus(0.2).toNumber()
      `, () => {
      expect(transformedCode).toMatch('const _a = new __Decimal(0.1).plus(0.2).toNumber()')
    })
    it(`
      ts Class
      input:
        constructor() {
          this.block = 0.1 + 0.2
        }
      output:
        constructor() {
          this.block = new __Decimal(0.1).plus(0.2).toNumber()
        }
      `, () => {
      expect(transformedCode).toMatch('this.block = new __Decimal(0.1).plus(0.2).toNumber()')
    })
    it(`
      ts Class
      input:
        calc() {
          this.block = this.block + 0.7 - 0.9
        }
      output:
        calc() {
          this.block = new __Decimal( this.block).plus(0.7).minus(0.9).toNumber()
        }
      `, () => {
      expect(transformedCode).toMatch('this.block = new __Decimal(this.block).plus(0.7).minus(0.9).toNumber()')
    })
    it(`
      ts Array
      input:
        const _arr = [0, 0.1 + 0.2, 3]
      output:
        const _arr = [0, new __Decimal(0.1).plus(0.2).toNumber(), 3]
      `, () => {
      expect(transformedCode).toMatch('const _arr = [0, new __Decimal(0.1).plus(0.2).toNumber(), 3]')
    })
    it(`
      ts Object
      input:
        const _obj_outer = {
          transform: 0.1 + 0.2,
        }
      output:
        const _obj_outer = {
          transform: new __Decimal(0.1).plus(0.2).toNumber(),
        }
      `, () => {
      expect(transformedCode).toMatch('transform: new __Decimal(0.1).plus(0.2).toNumber(),')
    })
    it(`
      ts Computation
      input:
                             (0.1 + 0.2) * (1 - 0.9) + (0.5 * 0.6 / (1 - 0.2)) + 0.5
        const _computation = (0.1 + 0.2) * (1 - 0.9) + 0.5 * 0.6 / (1 - 0.2) + 0.5
      output:
        const _computation = new __Decimal(0.1).plus(0.2).times(new __Decimal(1).minus(0.9)).plus(new __Decimal(0.5).times(0.6).div(new __Decimal(1).minus(0.2))).plus(0.5).toNumber()
      `, () => {
      expect(transformedCode).toMatch('const _computation = new __Decimal(0.1).plus(0.2).times(new __Decimal(1).minus(0.9)).plus(new __Decimal(0.5).times(0.6).div(new __Decimal(1).minus(0.2))).plus(0.5).toNumber()')
    })
    it(`
      ts splicing
      input:
        const _splicing = 0.1 + 0.2 + ''
      output:
        const _splicing = 0.1 + 0.2 + ''
      `, () => {
      expect(transformedCode).toMatch('const _splicing = 0.1 + 0.2 + \'\'')
    })
    it(`
      ts next-ad-ignore
      input:
        // next-ad-ignore
        const _s = 0.1 + 0.2
      output:
        // next-ad-ignore
        const _s = 0.1 + 0.2
      `, () => {
      expect(transformedCode).toMatch('const _s = 0.1 + 0.2')
    })
    it(`
      ts next-ad-ignore object.property
      input:
        const _obj_outer = {
          // next-ad-ignore
          skip: 0.1 + 0.2,
        }
      output:
        const _obj_outer = {
          // next-ad-ignore
          skip: 0.1 + 0.2,
        }
      `, () => {
      expect(transformedCode).toMatch('skip: 0.1 + 0.2,')
    })
    it(`
      ts block-ad-ignore
      input:
        // block-ad-ignore
        {
          const _obj = 0.1 + 0.2
          const _obj_block = 0.1 + 0.2
        }
      output:
        // block-ad-ignore
        {
          const _obj = 0.1 + 0.2
          const _obj_block = 0.1 + 0.2
        }
      `, () => {
      expect(transformedCode).toMatch('const _obj = 0.1 + 0.2')
      expect(transformedCode).toMatch('const _obj_block = 0.1 + 0.2')
    })
    it(`
      ts block-ad-ignore function
      input:
        // block-ad-ignore
        function _test() {
          const _block = 0.1 + 0.2
          const _ad = 0.1 + 0.2
        }
      output:
        // block-ad-ignore
        function _test() {
          const _block = 0.1 + 0.2
          const _ad = 0.1 + 0.2
        }
      `, () => {
      expect(transformedCode).toMatch('const _block = 0.1 + 0.2')
      expect(transformedCode).toMatch('const _ad = 0.1 + 0.2')
    })

    it(`
      ts skip integer
      input:
        const integer = 1 + 2 + 3
      output:
        const integer = 1 + 2 + 3
      `, () => {
      expect(transformedCode).toMatch('const integer = 1 + 2 + 3')
    })
    it(`
      ts skip integer mix
      input:
        const _mix = integer * (3 + 4) - (5 - 6 + 0.4)
      output:
        const _mix = new __Decimal(integer).times(3 + 4).minus(new __Decimal(5 - 6).plus(0.4))
      `, () => {
      expect(transformedCode).toMatch('const _mix = new __Decimal(integer).times(3 + 4).minus(new __Decimal(5 - 6).plus(0.4))')
    })
  }
})
