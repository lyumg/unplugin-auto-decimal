import { resolve } from 'node:path'
import { promises as fs } from 'node:fs'
import { describe, expect, it } from 'vitest'
import fastGlob from 'fast-glob'
import { createContext } from '../src/core/context'

describe('transform', async () => {
  const ctx = createContext({ supportString: true })
  const root = resolve(__dirname, 'fixtures')
  const files = await fastGlob('*.ts', {
    cwd: root,
    onlyFiles: true,
  })
  for (const file of files) {
    const fixture = await fs.readFile(resolve(root, file), 'utf-8')
    const transformedCode = (await ctx.transform(fixture, file))?.code ?? fixture
    it(`
      ts
      input:
        const _a = 0.1 + 0.2
      output:
        const _a = new __Decimal(0.1).add(0.2).toNumber()
      `, () => {
      expect(transformedCode).toMatch('const _a = new __Decimal(0.1).add(0.2).toNumber()')
    })
    it(`
      ts Class
      input:
        constructor() {
          this.block = 0.1 + 0.2
        }
      output:
        constructor() {
          this.block = new __Decimal(0.1).add(0.2).toNumber()
        }
      `, () => {
      expect(transformedCode).toMatch('this.block = new __Decimal(0.1).add(0.2).toNumber()')
    })
    it(`
      ts Array
      input:
        const _arr = [0, 0.1 + 0.2, 3]
      output:
        const _arr = [0, new __Decimal(0.1).add(0.2).toNumber(), 3]
      `, () => {
      expect(transformedCode).toMatch('const _arr = [0, new __Decimal(0.1).add(0.2).toNumber(), 3]')
    })
    it(`
      ts Object
      input:
        const _obj_outer = {
          transform: 0.1 + 0.2,
        }
      output:
        const _obj_outer = {
          transform: new __Decimal(0.1).add(0.2).toNumber(),
        }
      `, () => {
      expect(transformedCode).toMatch('transform: new __Decimal(0.1).add(0.2).toNumber(),')
    })
    it(`
      ts Computation
      input:
                             (0.1 + 0.2) * (1 - 0.9) + (0.5 * 0.6 / (1 - 0.2)) + 0.5
        const _computation = (0.1 + 0.2) * (1 - 0.9) + 0.5 * 0.6 / (1 - 0.2) + 0.5
      output:
        const _computation = new __Decimal(0.1).add(0.2).mul(new __Decimal(1).sub(0.9)).add(new __Decimal(0.5).mul(0.6).div(new __Decimal(1).sub(0.2))).add(0.5).toNumber()
      `, () => {
      expect(transformedCode).toMatch('const _computation = new __Decimal(0.1).add(0.2).mul(new __Decimal(1).sub(0.9)).add(new __Decimal(0.5).mul(0.6).div(new __Decimal(1).sub(0.2))).add(0.5).toNumber()')
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
  }
})
