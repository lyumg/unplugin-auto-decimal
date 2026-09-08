import type { Operator } from '../../types'
import type { Context } from '../context'
import { OPERATOR } from '../constant'
import { getPkgName } from '../utils'
/*
 * @Date: 2026-09-03 11:50:40
 * @Author: lyumg
 * @FilePath: /unplugin-auto-decimal/src/core/ast/decimal-node.ts
 */
export class DecimalNode {
  private decimalTemplate = `new PKGName(left).operator(right)`
  integer = false
  invalidNumeric = false
  leftNode?: DecimalNode
  rightNode?: DecimalNode
  left = ''
  right = ''
  operator = ''
  constructor(operator: Operator) {
    this.operator = OPERATOR[operator]
  }

  toString(ctx?: Context) {
    let template = this.decimalTemplate
    if (this.left.startsWith('new')) {
      template = template.replace(`new PKGName(left)`, this.left)
    }
    else {
      template = template.replace('left', this.left)
    }

    template = template.replace('operator', this.operator).replace('right', this.right)
    if (ctx) {
      template = template.replace(/PKGName/g, getPkgName(ctx))
      if (ctx.callDecimal) {
        return template
      }
      return `${template}${ctx.callCode.startsWith('[') ? '' : '.'}${ctx.callCode}`
    }
    return template
  }
}
