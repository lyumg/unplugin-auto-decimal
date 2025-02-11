# 支持字符串计算

`supportString` 支持字符串数字进行运算，也就是说当你启用了这个属性的话，那么在你的项目中就不会出现数字字符串拼接的情况了
:::tip
这里的支持也仅仅只是支持可以转成数字的字符转，不可转换的字符串会跳过
:::
:::code-group
```ts [vite.config.ts]
export default defineConfig({
  plugins: [
    AutoDecimal({
      supportString: true
    })
  ]
})
```
:::

```ts {  5,11-12,15-16 }
const a = '1'
const b = a + 1
console.log(b, '这里的结果是 2，而不是 “11”')

const c = '1'
const d = c + '我也试试'
console.log(d, '1我也试试')
```

