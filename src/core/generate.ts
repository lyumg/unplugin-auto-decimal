import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { existsSync } from 'node:fs'
import type { InnerAutoDecimalOptions } from '../types'
import { DEFAULT_TO_DECIMAL_CONFIG } from './constant'

export async function generateDeclaration(options: InnerAutoDecimalOptions) {
  const filePath = options.dts as string
  const toDecimal = typeof options.toDecimal === 'boolean' ? DEFAULT_TO_DECIMAL_CONFIG : options.toDecimal
  const content = `/* eslint-disable */
// @ts-nocheck
// Generated by unplugin-auto-decimal
type ToDecimal = import('unplugin-auto-decimal/types').ToDecimal
declare interface String {
  ${toDecimal.name}: ToDecimal
}
declare interface Number {
  ${toDecimal.name}: ToDecimal
}
`
  const originalContent = existsSync(filePath) ? await readFile(filePath, 'utf-8') : ''
  if (originalContent !== content) {
    await writeDeclaration(filePath, content)
  }
}
async function writeDeclaration(filePath: string, content: string) {
  await mkdir(dirname(filePath), { recursive: true })
  return await writeFile(filePath, content, 'utf-8')
}
