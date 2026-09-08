import type { Context } from './context'
import { MagicStringAST } from 'magic-string-ast'
import { REGEX_VUE } from './constant'
import transformScript from './transformers/script'
import transformVue from './transformers/vue'
/*
 * @Date: 2026-09-02 14:31:20
 * @Author: lyumg
 * @FilePath: /unplugin-auto-decimal/src/core/transformer.ts
 */

export default function transformer(ctx: Context) {
  return (code: string) => {
    const s = new MagicStringAST(code)
    if (REGEX_VUE.test(ctx.id)) {
      transformVue(code, s, ctx)
    }
    else {
      transformScript(code, s, ctx)
    }
    if (!s.hasChanged())
      return
    return {
      code: s.toString(),
      map: s.generateMap({ source: ctx.id, includeContent: true, hires: true }),
    }
  }
}
