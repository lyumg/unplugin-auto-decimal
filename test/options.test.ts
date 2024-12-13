import { resolve } from 'node:path'
import { promises as fs } from 'node:fs'
import { describe, expect, it } from 'vitest'
import fastGlob from 'fast-glob'
import { createContext } from '../src/core/context'

describe('transform', async () => {
  const ctx = createContext({ supportString: true })
  const root = resolve(__dirname, 'fixtures')
  const files = await fastGlob('*options.vue', {
    cwd: root,
    onlyFiles: true,
  })
  for (const file of files) {
    const fixture = await fs.readFile(resolve(root, file), 'utf-8')
    const transformedCode = (await ctx.transform(fixture, file))?.code ?? fixture
    it(`
      vue
      input:
        const _s = \`\${0.1 + 0.2}\`
      output:
        const _s = \`\${new __Decimal(0.1).add(0.2).toNumber()}\`
      `, () => {
      // eslint-disable-next-line no-template-curly-in-string
      expect(transformedCode).toMatch('const _s = `${new __Decimal(0.1).add(0.2).toNumber()}`')
    })
    it(`
      vue next-ad-ignore
      input:
        // next-ad-ignore
        const _sum = 0.1 + 0.2
      output:
        // next-ad-ignore
        const _sum = 0.1 + 0.2
      `, () => {
      expect(transformedCode).toMatch('const _sum = 0.1 + 0.2')
    })
    it(`
      vue block-ad-ignore
      input:
        // block-ad-ignore
        {
          const _a = 0.1 + 0.2
          const _obj = { a: 0.1 + 0.2 }
        }
      output:
        // block-ad-ignore
        {
          const _a = 0.1 + 0.2
          const _obj = { a: 0.1 + 0.2 }
        }
      `, () => {
      expect(transformedCode).toMatch('const _a = 0.1 + 0.2')
      expect(transformedCode).toMatch('const _obj = { a: 0.1 + 0.2 }')
    })
    it(`
      vue template 
      input:
        <div :title="0.1 + 0.2">
          transform:{{ 0.1 + 0.2 }} b:{{ 1 - 0.9 }}
        </div>
      output:
        <div :title="new __Decimal(0.1).add(0.2).toNumber()">
          transform:{{ new __Decimal(0.1).add(0.2).toNumber() }} b:{{ new __Decimal(1).sub(0.9).toNumber() }}
        </div>
      `, () => {
      expect(transformedCode).toMatch('<div :title="new __Decimal(0.1).add(0.2).toNumber()">')
      expect(transformedCode).toMatch('transform:{{ new __Decimal(0.1).add(0.2).toNumber() }} b:{{ new __Decimal(1).sub(0.9).toNumber() }}')
    })
    it(`
      vue template next-ad-ignore
      input:
        <span :title="0.1 + 0.2">
          next-ad-ignore transform:{{ 0.1 + 0.2 }}
        </span>
      output:
        <span :title="0.1 + 0.2">
          next-ad-ignore transform:{{ new __Decimal(0.1).add(0.2).toNumber() }}
        </span>
      `, () => {
      expect(transformedCode).toMatch('<span :title="0.1 + 0.2">')
      expect(transformedCode).toMatch('next-ad-ignore transform:{{ new __Decimal(0.1).add(0.2).toNumber() }}')
    })
    it(`
      vue template next-ad-ignore
      input:
        <a :title="0.1 + 0.2">
          <!-- next-ad-ignore -->
          next-ad-ignore :{{ 0.1 + 0.2 }}
        </a>
      output:
        <a :title="new __Decimal(0.1).add(0.2).toNumber()">
          <!-- next-ad-ignore -->
          next-ad-ignore :{{ 0.1 + 0.2 }}
        </a>
      `, () => {
      expect(transformedCode).toMatch('<a :title="new __Decimal(0.1).add(0.2).toNumber()">')
      expect(transformedCode).toMatch('next-ad-ignore:{{ 0.1 + 0.2 }}')
    })
    it(`
      vue template next-ad-ignore multiple skip:{{ 0.1 + 0.2 }} {{ 0.2 + 0.1 }}
      input:
        <!-- next-ad-ignore multiple -->
        multiple skip:{{ 0.1 + 0.2 }} {{ 0.2 + 0.1 }}
        multiple transform:{{ 1 - 0.9 }}
      output:
        <!-- next-ad-ignore multiple -->
        multiple skip:{{ 0.1 + 0.2 }} {{ 0.2 + 0.1 }}
        multiple transform:{{ new __Decimal(1).sub(0.9).toNumber() }}
      `, () => {
      expect(transformedCode).toMatch('multiple skip:{{ 0.1 + 0.2 }} {{ 0.2 + 0.1 }}')
      expect(transformedCode).toMatch('multiple transform:{{ new __Decimal(1).sub(0.9).toNumber() }}')
    })
    it(`
      vue template block-ad-ignore
      input:
        <!-- block-ad-ignore -->
        <p :block-title="0.1 + 0.2">
          block-ad-ignore:{{ 0.1 + 0.2 }}
        </p>
      output:
        <!-- block-ad-ignore -->
        <p :block-title="0.1 + 0.2">
          block-ad-ignore:{{ 0.1 + 0.2 }}
        </p>
      `, () => {
      expect(transformedCode).toMatch('<p :block-title="0.1 + 0.2">')
      expect(transformedCode).toMatch('block-ad-ignore:{{ 0.1 + 0.2 }}')
    })
  }
})
