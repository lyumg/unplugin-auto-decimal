# 支持 new Function ^(1.4.0)

默认情况下，`AutoDecimal` 仅会处理计算表达式，当启用了 `supportString` 属性时，也仅仅会处理计算表达式中可以被转换为数字的字符串。

```ts
// AutoDecimal 默认参数下
const a = 0.1
const c = a + '0.2'
console.log(c) // "0.10.2"
```

当 `supportString` 为 true 时
```ts
const a = 0.1
// 当启用 `supportString` 后，由于 '0.2' 可以被转换为数字，所以计算结果为 0.3
const c = a + '0.2'
console.log(c) // 0.3
// 由于 'b' 不能转换为数字，所以结果为 '0.1b'
const d = a + 'b'
console.log(d) // '0.1b'
```

但是下面的却不会进行转换
```ts
const fn = new Function('a', 'b', 'return a + b')
const result = fn(0.1, 0.2)
console.log(result) // 0.30000000000000004
```
因为 `fn` 是通过 `new Function` 创建的函数，而需要转换的 `return a + b`，是一个字符串，且 `AutoDecimal` 仅处理计算表达式，不会处理单个字符串。所以 `new Function` 中的字符串，会跳过。

那么如果想要 `AutoDecimal` 能够处理 `new Function` 中的字符串时，要怎么办呢。


## 配置项
| 属性               | 描述                  | 类型     | 默认值     | 
| :----------------:  | :-------------------: | :------: |:------: |
| toDecimal | 默认继承 [`toDecimal`](./to-decimal.md) 参数，如果设置此参数，则优先使用此参数  | ToDecimalConfig | - | 
| injectWindow ^(1.4.3) | 将 `Decimal` 挂载到 `window` 中的属性名称 | string | - |


## supportNewFunction
:::code-group
```ts [vite.config.ts] {10}
export default defineConfig({
  plugins: [
    AutoDecimal({
      /**
       * supportNewFunction: {
       *  toDecimal?: boolean
       *  injectWindow?: string
       * }
       */
      supportNewFunction: true
    })
  ]
})
```
:::

此时， `AutoDecimal` 就会解析 `new Function` 中的 'return a + b' 了。

```ts
const fn = new Function('a', 'b', 'return a + b')
const result = fn(0.1, 0.2)
console.log(result) // 0.3
```

### supportNewFunction.toDecimal
此属性可以告诉  `AutoDecimal` 在处理 `new Function` 时，是否需要跟随 [`toDecimal`](./to-decimal.md)的设定来进行处理。
当启用了 `toDecimal` 后，可以通过 `supportNewFunction.toDecimal` 来单独启用、停用或者修改  `toDecimal` 的设定。

:::code-group
```ts [vite.config.ts] {5}
export default defineConfig({
  plugins: [
    AutoDecimal({
      toDecimal: true,
      supportNewFunction: {
        // 当这里设为 false 时，new Function 中的参数将不需要使用 toDecimal()
        toDecimal: false
      }
    })
  ]
})
```
:::


:::tip
目前 `new Function` 支持的调用方式有限（目前所能想到的一些调用方式都已实现），它可以赋值给一个对象属性、数组中的某项、某个变量，但是一定不要太过于复杂，如果你遇到因为某些特殊的调用方式而造成的无法解析，或者无法得到正确的结果时，可以提[issues](https://github.com/lyumg/unplugin-auto-decimal/issues)，我会第一时间解决。
:::

### supportNewFunction.injectWindow
由于在转换 `new Function` 时，`Decimal` 是通过参数注入的方式实现，需要查找 `new Function` 的定义、调用以及作用域等相关信息，费时费力。那么如果想 “肆意妄为” 的在 `new Function` 中使用 `Decimal`，要怎么办呢？可以先将 `decimal.js` 挂载到 `window` 上，然后通过 `injectWindow` 提供挂载的属性名称即可。

不使用 `injectWindow` 时，通过参数注入 `Decimal`
```ts {7,8}
const fn = new Function('a', 'b', 'return a + b')
const result = fn(0.1, 0.2)
console.log(result) // 0.3

// 上述代码会转换为
import Decimal from 'decimal.js'
const fn = new Function('a', 'b', 'Decimal', 'return new Decimal(a).plus(b).toNumber()')
const result = fn(0.1, 0.2, Decimal)
console.log(result) // 0.3
```

使用 `injectWindow` 时，直接使用 `window[injectWindow]` 来调用 `Decimal`
:::code-group
```ts [vite.config.ts] {5}
export default defineConfig({
  plugins: [
    AutoDecimal({
      supportNewFunction: {
        injectWindow: 'injectDecimal'
      }
    })
  ]
})
```
:::

```ts {6}
const fn = new Function('a', 'b', 'return a + b')
const result = fn(0.1, 0.2)
console.log(result) // 0.3

// 此时，上述代码会转换为
const fn = new Function('a', 'b', 'return new window.injectDecimal(a).plus(b).toNumber()')
const result = fn(0.1, 0.2)
console.log(result) // 0.3
```
