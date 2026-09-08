/*
 * @Date: 2026-01-29 13:34:14
 * @Author: lyumg
 * @FilePath: /unplugin-auto-decimal/test/decorator.test.ts
 */
import { promises as fs } from 'node:fs'
import { resolve } from 'node:path'
import fastGlob from 'fast-glob'
import { describe, expect, it } from 'vitest'
import { Context } from '../src/core/context'

describe('transform decorator', async () => {
  const root = resolve(__dirname, 'fixtures/decorator')
  const files = await fastGlob('*.ts', {
    cwd: root,
    onlyFiles: true,
  })
  const file = files[0]
  const fixture = await fs.readFile(resolve(root, file), 'utf-8')
  const ctx = new Context(file, {
    supportString: false,
    tailPatchZero: false,
    package: 'decimal.js-light',
    toDecimal: false,
    dts: false,
    decimalName: '__Decimal',
    decorator: true,
    supportNewFunction: false,
  })
  const transformedCode = ctx.transform(fixture)?.code ?? fixture
  it(`
        @Log
        export class Test {
          @Field
          field = 0.1 + 0.2
        }
        function Field(_target: Test, _propertyKey: string): void {

        }
        function Log(_target: typeof Test): void {

        }
        `, () => {
    expect(transformedCode).toMatch('field = new __Decimal(0.1).plus(0.2).toNumber()')
  })
})
