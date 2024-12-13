import type { AutoDecimalOptions } from './types'
import unplugin from '.'

export default unplugin.esbuild as (options?: AutoDecimalOptions) => any
