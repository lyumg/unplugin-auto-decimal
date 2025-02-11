# 末尾拼接字符串

在一个计算表达式的末尾拼接上一个空字符串。
:::code-group
```ts [vite.config.ts] {3}
export default defineConfig({
  plugins: [
    AutoDecimal({ supportString: true })
  ]
})
```
:::
```ts {2-3,5-6}
const a = 0.2
const b = a + 0.1
console.log(b, '0.3')

const c = a + 0.1 + ''
console.log(c, '0.30000000000000004')

```

当`supportString: false`, 可以在一个计算表达式的末尾拼接任意字符串。
:::code-group
```ts [vite.config.ts] {3}
export default defineConfig({
  plugins: [
    AutoDecimal({ supportString: false })
  ]
})
```
:::
```ts {2-3,5-6}
const a = 0.2
const b = a + 0.1
console.log(b, '0.3')

const c = a + 0.1 + '1'
console.log(c, '0.300000000000000041')

```