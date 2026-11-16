import type { NodePath } from '@babel/traverse'
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import { isIdentifier } from '@babel/types'
import { describe, expect, it } from 'vitest'
import { getStaticValue } from '../src/core/ast/helper/static-value'

const code = `
import external from './external'

const fromUndefined = undefined
let assignedUndefined = undefined
const chained = assignedUndefined
const fromNull = null
const fromVoid = void 0
let uninitialized
const refUninitialized = uninitialized
const objWithUndefined = { x: undefined }
const arrWithUndefined = [undefined]
const unknownGlobal = someNonExistentGlobal
const fromImport = external
function shadowParam(undefined) {
  const paramShadow = undefined
  return paramShadow
}
function shadowVar() {
  var undefined = 5
  const varShadow = undefined
  return varShadow
}
`

/**
 * 收集代码中所有变量声明初始化表达式的静态求值结果
 * 返回值语义与 getStaticValue 保持一致：
 *   - null：无法求值或存在 import 依赖
 *   - undefined：实际值为 null 或 undefined
 */
function collectStaticValues(source: string) {
  const result: Record<string, unknown> = {}
  const ast = parse(source, { sourceType: 'module' })
  traverse(ast, {
    VariableDeclarator(path) {
      if (isIdentifier(path.node.id) && path.node.init)
        result[path.node.id.name] = getStaticValue(path.get('init') as NodePath)
    },
  })
  return result
}

describe('getStaticValue 静态求值', () => {
  const values = collectStaticValues(code)

  it('undefined 标识符（含赋值与引用链）应求值为 undefined 而非 null', () => {
    expect(values.fromUndefined).toBeUndefined()
    expect(values.assignedUndefined).toBeUndefined()
    expect(values.chained).toBeUndefined()
  })

  it('null 字面量、void 0、未初始化变量保持 undefined 语义', () => {
    expect(values.fromNull).toBeUndefined()
    expect(values.fromVoid).toBeUndefined()
    expect(values.refUninitialized).toBeUndefined()
  })

  it('对象与数组中的 undefined 可以正常静态求值', () => {
    expect(values.objWithUndefined).toEqual({ x: undefined })
    expect(values.arrWithUndefined).toEqual([undefined])
  })

  it('无绑定的未知标识符与 import 依赖返回 null', () => {
    expect(values.unknownGlobal).toBeNull()
    expect(values.fromImport).toBeNull()
  })

  it('undefined 被参数或 var 遮蔽时按局部绑定解析', () => {
    expect(values.paramShadow).toBeNull()
    expect(values.varShadow).toBe(5)
  })
})
