# 显式转换 ^(1.2.0)

:::tip
`toDecimal` 启用后，所有的计算将不会进行转换，只有显示的调用 `toDecimal` 才会将计算转换为 `decimal` 方法。
同时，属性`supportString`, `tailPatchZero` 也将失效。
:::

## 配置项
`toDecimal` 配置项可以全局配置，也可以在调用时配置。调用时的配置项优先于全局配置。

| 属性               | 描述     | 类型     | 默认值     | 
| ----------------  | :------: | :------: |:------: |
| callMethod | 转换为 `decimal` 后，调用的方法 | toNumber \| toString \| toFixed | toNumber | 
| precision | 保留的小数精度, 仅当 `callMethod` 为 toFixed 有效 | number | 2 |
| roundingModes | `decimal` 的 roundingModes, 仅当 `callMethod` 为 toFixed 有效 | number \| ROUNDING_MODES | ROUND_HALF_UP |
| name | 用于自定义转换 `decimal`时，匹配的函数名称，仅配置插件时可用 | string  | toDecimal |

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
:::
```ts
export {}
declare module 'unplugin-auto-decimal/types' {
  interface AutoDecimal{
    package: 'big.js' // 填写对应的 package 即可
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
