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

:::warning
如果一个计算表达式中存在变量时，`AutoDecimal` 不会检索变量的值是否合法。
:::
将上面的示例稍微改写一下

```ts { 7-11 }
const a = '1'
const b = a + 1
// 这样是可以的
console.log(b, '这里的结果是 2，而不是 “11”')

// 改写
// const c = '1'
// const d = c + '我也试试'
const c = '我也试试'
// 此处仍然会转换为 const d = new __Decimal(c).plus(1).toNumber()
// 所以这里 Decimal 会报错，因为 c 不是一个有效的数值
const d = c + 1
console.log(d, '1我也试试')
```
