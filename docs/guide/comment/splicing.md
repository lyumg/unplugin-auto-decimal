# 末尾拼接字符串

在一个计算表达式的末尾拼接上一个空字符串。
```ts {4,9-10,12-13}
// vite.config.ts
export default defineConfig({
  plugins: [
    AutoDecimal({ supportString: true })
  ]
})
// xxx.ts
const a = 0.2
const b = a + 0.1
console.log(b, '0.3')

const c = a + 0.1 + ''
console.log(c, '0.30000000000000004')

```

当`supportString: false`, 可以在一个计算表达式的末尾拼接任意字符串。
```ts {4,9-10,12-13}
// vite.config.ts
export default defineConfig({
  plugins: [
    AutoDecimal({ supportString: false })
  ]
})
// xxx.ts
const a = 0.2
const b = a + 0.1
console.log(b, '0.3')

const c = a + 0.1 + '1'
console.log(c, '0.300000000000000041')

```