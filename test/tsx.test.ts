import { promises as fs } from 'node:fs'
import { resolve } from 'node:path'
import fastGlob from 'fast-glob'
import { describe, expect, it } from 'vitest'
import { transform } from '../src/core/unplugin'

describe('transform tsx', async () => {
  const root = resolve(__dirname, 'fixtures')
  const files = await fastGlob('*.tsx', {
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
        tsx normal
        input: 
          <div title={(0.1 + 0.2).toString()}>
        output: 
          <div title={(new __Decimal(0.1).plus(0.2).toNumber()).toString()}>
        input: 
          <div>{0.1 + 0.2}</div>
        output: 
          <div>{new __Decimal(0.1).plus(0.2).toNumber()}</div>
        `, () => {
      expect(transformedCode).toMatch('<div title={(new __Decimal(0.1).plus(0.2).toNumber()).toString()}>')
      expect(transformedCode).toMatch('<div>{new __Decimal(0.1).plus(0.2).toNumber()}</div>')
    })
    it(`
        tsx block-ad-ignore
        input: 
          <span title={(0.1 + 0.2).toString()}>{0.1 + 0.2}</span>
        output: 
          <span title={(0.1 + 0.2).toString()}>{0.1 + 0.2}</span>
        `, () => {
      expect(transformedCode).toMatch('<span title={(0.1 + 0.2).toString()}>{0.1 + 0.2}</span>')
    })
    it(`
        tsx next-ad-ignore
        input: 
          {/* next-ad-ignore */}
          <p title={(0.1 + 0.2).toString()}>{0.1 + 0.2}</p>
        output: 
          <p title={(0.1 + 0.2).toString()}>{new __Decimal(0.1).plus(0.2).toNumber()}</p>
        `, () => {
      expect(transformedCode).toMatch('<p title={(0.1 + 0.2).toString()}>{new __Decimal(0.1).plus(0.2).toNumber()}</p>')
    })
    it(`
      tsx next-ad-ignore multiple
      input: 
        {/* next-ad-ignore */}
        skip: {0.1 + 0.2} transform: {1 - 0.9}
      output:
        skip: {0.1 + 0.2} transform: {1 - 0.9}
      `, () => {
      expect(transformedCode).toMatch('skip: {0.1 + 0.2} transform: {1 - 0.9}')
    })
  }
})
