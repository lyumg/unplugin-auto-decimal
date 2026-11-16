# tryGetting 尝试获取变量值 ^(2.0.0)

`tryGetting` 启用后，`AutoDecimal` 会尝试获取计算表达式中变量的值，如果能够成功获取到变量的值，且值是一个数值时，会进行转换，如果值不是一个数值时，会保持原样。如果无法解析变量的话，默认会进行转换，因为有些变量是用来接收服务端回来的值。


:::warning

目前 `AutoDecimal` 不会解析通过 `import` 引入的变量

:::

## 使用
:::code-group
```ts [vite.config.ts]
export default defineConfig({
  plugins: [
    AutoDecimal({
      tryGetting: true,
    })
  ]
})
```
:::

```ts
const a = 0.1
const b = a + 0.2
console.log(b, 0.3)

const aa = "a1"
// 这里的 bb 不会进行转换，会按原样输出，因为 aa 不是一个有效的数值
const bb = aa + 0.2
console.log(bb, 'a10.2')
```

当计算表达式中，一个变量值为一个有效的数值字符串时，想要进行转换的话，需要配置 `supportString`，让 `AutoDecimal` 支持解析数值字符串。

:::code-group
```ts [vite.config.ts] {5}
export default defineConfig({
  plugins: [
    AutoDecimal({
      tryGetting: true,
      supportString: true,
    })
  ]
})
```
:::

```ts

const a = "0.1"
const b = a + 0.2
// 现在会进行转换，得到 0.3
console.log(b, 0.3)

const aa = "a1"
// 这里的 bb 还是不会进行转换，会按原样输出，因为 a1 不是一个有效的数值
const bb = a + 0.2
console.log(bb, 'a10.2')
```
