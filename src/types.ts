import type { FilterPattern } from 'vite'

export interface Options {
  include?: FilterPattern
  exclude?: FilterPattern
  supportString?: boolean
}

type Overwrite<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U

export type OptionsResolved = Overwrite<
  Required<Options>,
  Pick<Options, 'supportString'>
>
