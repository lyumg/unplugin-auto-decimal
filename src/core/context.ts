import { createFilter } from 'vite'
import type { MagicStringAST } from 'magic-string-ast'
import type { AutoDecimalOptions } from '../types'
import { REGEX_NODE_MODULES, REGEX_SUPPORTED_EXT, REGEX_VUE } from './constant'
import { transformAutoDecimal, transformVueAutoDecimal } from './transform'

export function createContext(autoDecimalOptions: AutoDecimalOptions = {}) {
  const filter = createFilter(
    [REGEX_SUPPORTED_EXT, ...REGEX_VUE],
    [REGEX_NODE_MODULES],
  )
  function transform(code: string, id: string) {
    let msa: MagicStringAST
    if (REGEX_VUE.some(reg => reg.test(id))) {
      msa = transformVueAutoDecimal(code, autoDecimalOptions)
    }
    else {
      msa = transformAutoDecimal(code, autoDecimalOptions)
    }
    if (!msa.hasChanged())
      return
    return {
      code: msa.toString(),
      map: msa.generateMap({ source: id, includeContent: true, hires: true }),
    }
  }
  return {
    filter,
    transform,
  }
}
