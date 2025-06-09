# 支持 new Function ^(1.4.0)

默认情况下，`AutoDecimal` 仅会处理计算表达式，当启用了 `supportString` 属性时，也仅仅会处理计算表达式中的数字字符串。

```ts
// AutoDecimal 默认参数下
const a = 0.1
const c = a + '0.2'
console.log(c) // "0.10.2"
```

当 `supportString` 为 true 时
```ts
const a = 0.1
const c = a + '0.2'
console.log(c) // 0.3
```

但是下面的却不会进行转换
```ts
const fn = new Function('a', 'b', 'return a + b')
const result = fn(0.1, 0.2)
console.log(result) // 0.30000000000000004
```
因为 `fn` 是通过 `new Function` 使用字符串创建的函数，而 `AutoDecimal` 仅处理计算表达式，但是不会处理字符串。所以当遇到字符串时，会自动跳过（即使 `supportString` 为 true）。

所以如果想要 `AutoDecimal` 处理用于创建 `new Function` 所需要的字符串时，需要启用 `supportNewFunction`。
:::code-group
```ts [vite.config.ts]
export default defineConfig({
  plugins: [
    AutoDecimal({
      supportNewFunction: true
    })
  ]
})
```
:::
此时
```ts
const fn = new Function('a', 'b', 'return a + b')
const result = fn(0.1, 0.2)
console.log(result) // 0.3
```

