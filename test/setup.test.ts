import { resolve } from 'node:path'
import { promises as fs } from 'node:fs'
import { describe, expect, it } from 'vitest'
import fastGlob from 'fast-glob'
import { createContext } from '../src/core/context'

describe('transform', async () => {
  const ctx = createContext({ supportString: true })
  const root = resolve(__dirname, 'fixtures')
  const files = await fastGlob('*setup.vue', {
    cwd: root,
    onlyFiles: true,
  })
  for (const file of files) {
    const fixture = await fs.readFile(resolve(root, file), 'utf-8')
    const transformedCode = (await ctx.transform(fixture, file))?.code ?? fixture

    it(`
      vue.setup
      input: 
        const sum = ref(0.1 + 0.2)
      output:
        const sum = ref(new __Decimal(0.1).add(0.2).toNumber())
      `, () => {
      expect(transformedCode).toMatch('sum = ref(new __Decimal(0.1).add(0.2).toNumber())')
    })
    it(`
      vue.setup next-ad-ignore
      input:
        const obj = {
          // next-ad-ignore
          a: 0.1 + 0.2,
        }
      output:
        const obj = {
          // next-ad-ignore
          a: 0.1 + 0.2,
        }
      `, () => {
      expect(transformedCode).toMatch('a: 0.1 + 0.2')
    })
    it(`
      vue.setup block-ad-ignore
      input:
        // block-ad-ignore
        function _test() {
          return 0.1 + 0.2
        }
      output:
        // block-ad-ignore
        function _test() {
          return 0.1 + 0.2
        }
      `, () => {
      expect(transformedCode).toMatch('return 0.1 + 0.2')
    })
    it(`
      vue.setup template
      input:
        <div>transformed:{{ obj.a }} {{ 0.1 + 0.2 }}</div>
      output:
        <div>transformed:{{ obj.a }} {{ new __Decimal(0.1).add(0.2).toNumber() }}</div>
      `, () => {
      expect(transformedCode).toMatch('<div>transformed:{{ obj.a }} {{ new __Decimal(0.1).add(0.2).toNumber() }}</div>')
    })
    it(`
      vue.setup template next-ad-ignore
      input:
        <!-- next-ad-ignore -->
        next-ad-ignore:{{ 0.1 + 0.2 }}
      output:
        <!-- next-ad-ignore -->
        next-ad-ignore:{{ 0.1 + 0.2 }}
      `, () => {
      expect(transformedCode).toMatch('next-ad-ignore:{{ 0.1 + 0.2 }}')
    })
    it(`
      vue.setup template next-ad-ignore
      input:
        <!-- next-ad-ignore -->
        <p :skip-title="(0.1 + 0.2).toString()">
          {{ 0.1 + 0.2 }}
        </p>
      output:
        <!-- next-ad-ignore -->
        <p :skip-title="(0.1 + 0.2).toString()">
          next-ad-ignore transform: {{ new __Decimal(0.1).add(0.2).toNumber() }}
        </p>
      `, () => {
      expect(transformedCode).toMatch('next-ad-ignore:{{ 0.1 + 0.2 }}')
      expect(transformedCode).toMatch('next-ad-ignore transform: {{ new __Decimal(0.1).add(0.2).toNumber() }}')
    })
    it(`
      vue.setup template next-ad-ignore multiple
      input:
        <!-- next-ad-ignore -->
        next-ad-ignore multiple:{{ 0.1 + 0.2 }} {{ 1 - 0.9 }}
      output:
        <!-- next-ad-ignore -->
        next-ad-ignore multiple:{{ 0.1 + 0.2 }} {{ 1 - 0.9 }}
      `, () => {
      expect(transformedCode).toMatch('next-ad-ignore multiple:{{ 0.1 + 0.2 }} {{ 1 - 0.9 }}')
    })
    it(`
      vue.setup template next-ad-ignore multiple
      input:
        <!-- next-ad-ignore -->
        next-ad-ignore skip:{{ 0.1 + 0.2 }}
        next-ad-ignore transform: {{ 1 - 0.9 }}
      output:
        <!-- next-ad-ignore -->
        next-ad-ignore multiple skip:{{ 0.1 + 0.2 }}
        next-ad-ignore multiple transform: {{ new __Decimal(1).sub(0.9).toNumber() }}
      `, () => {
      expect(transformedCode).toMatch('next-ad-ignore multiple skip:{{ 0.1 + 0.2 }}')
      expect(transformedCode).toMatch('next-ad-ignore multiple transform: {{ new __Decimal(1).sub(0.9).toNumber() }}')
    })
    it(`
      vue.setup template block-ad-ignore
      input:
        <!-- block-ad-ignore -->
        <div style="color: red">
          block-ad-ignore:{{ 11.2 + 24.4 + 66 / (0.1 + 0.2) }}
        </div>
      output:
        <!-- block-ad-ignore -->
        <div style="color: red">
          block-ad-ignore:{{ 11.2 + 24.4 + 66 / (0.1 + 0.2) }}
        </div>
      `, () => {
      expect(transformedCode).toMatch('block-ad-ignore:{{ 11.2 + 24.4 + 66 / (0.1 + 0.2) }}')
    })
  }
})
