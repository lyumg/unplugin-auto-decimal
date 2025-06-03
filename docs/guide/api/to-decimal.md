# 显式转换 ^(1.2.0)

:::tip
`toDecimal` 启用后，所有的计算将不会进行转换，只有显式调用 `toDecimal` 才会将计算转换为 `Decimal` 方法。
同时，属性`supportString`, `tailPatchZero` 也将失效。
:::

## 配置项
`toDecimal` 配置项可以全局配置，也可以在调用时配置。调用时的配置项优先于全局配置。

:::warning
下述所有属性的值，仅支持字面量等具体值，不支持变量。

如想使用变量的话，可以通过 `callMethod: 'decimal'` 得到 `Decimal` 实例，然后通过 `Decimal` 实例来调用对应的方法来传入变量
:::

| 属性               | 描述                  | 类型     | 默认值     | 
| ----------------  | :-------------------: | :------: |:------: |
| callMethod | 转换为 `Decimal` 后，调用的方法。值为 `decimal` 时，会返回 `Decimal` 实例 | toNumber \| toString \| toFixed \| decimal ^(1.3.0) | toNumber | 
| precision | 保留的小数精度, 仅当 `callMethod` 为 toFixed 有效 | number | 2 |
| roundingModes | `Decimal` 的 roundingModes, 仅当 `callMethod` 为 toFixed 有效 | number \| ROUNDING_MODES | ROUND_HALF_UP |
| name | 用于自定义转换 `Decimal`时，匹配的函数名称，**仅配置插件时可用** | string  | toDecimal |

## TypeScript 支持

:::code-group

```ts [vite.config.ts]
export default defineConfig({
  plugins: [
    AutoDecimal({
      toDecimal: true,
      // 默认在根目录生成一个 'auto-decimal.d.ts' 文件
      dts: true
    })
  ]
})
```
:::

:::code-group

```json [tsconfig.json]
{
  "compilerOptions": {
    // ...
    "types": ["./auto-decimal.d.ts" /* ... */]
  }
}
```
:::

:::warning
如果更改了 `package` 配置，想要 `roundingModes` 给予足够正确的提示，需要在项目中创建一个 d.ts 文件，并且写入相应的 `package`。

同时，如果想要返回 `Decimal` 时得到相应的类型，需要指定 `decimal`
:::
```ts
export {}
declare module 'unplugin-auto-decimal/types' {
  interface AutoDecimal{
    // 填写对应的 package 即可
    package: 'big.js'
    // callMethod: 'decimal' 时的类型
    decimal: import('decimal.js-light').Decimal
  }
}
```

## 使用
:::code-group
```ts [vite.config.ts]
export default defineConfig({
  plugins: [
    AutoDecimal({
      // toDecimal: true
      toDecimal: { 
        callMethod: 'toNumber', 
        precision: 2, 
        roundingModes: 'ROUND_HALF_UP',
        name: 'toDecimal'
      }
    })
  ]
})
```
:::
```ts
const a = 0.1 + 0.2
console.log(a, '0.30000000000000004')

const b = 0.1 + 0.2.toDecimal()
console.log(b, 0.3)

const c = 0.1111 + 0.2222.toDecimal({precision: 3, callMethod: 'toFixed', roundingModes: 'ROUND_UP'})
// const c = new Decimal(0.1111).plus(0.2222).toFixed(3, Decimal.ROUND_UP)
console.log(c, "0.334")
```

如果感觉上面的使用方法有些莫名其妙，也可以将其用括号包裹后，在调用 `toDecimal`。
```ts
const a = 0.1 + 0.2
console.log(a, '0.30000000000000004')

const b = (0.1 + 0.2).toDecimal()
console.log(b, 0.3)

const c = (0.1111 + 0.2222).toDecimal({precision: 3, callMethod: 'toFixed', roundingModes: 'ROUND_UP'})
console.log(c, "0.334")
```

当在配置 `AutoDecimal` 时，更改了 `name` 属性

:::code-group
```ts [vite.config.ts] {5}
export default defineConfig({
  plugins: [
    AutoDecimal({
      toDecimal: { 
        name: '_t'
      }
    })
  ]
})
```
:::
```ts
// 调用方法时，也需要使用更改后的 name
const b = (0.1 + 0.2)._t()
console.log(b, 0.3)

const c = (0.1111 + 0.2222)._t({precision: 3, callMethod: 'toFixed', roundingModes: 'ROUND_UP'})
console.log(c, "0.334")
```