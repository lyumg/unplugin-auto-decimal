# 末位补 0

在以往很多的项目中，可能或多或少的使用过 “+” 来进行字符串的拼接组合，甚至很多会在末尾添加一个空的字符串用来将某个变量变成字符串。

其实这么做也是无可厚非的，毕竟在 JavaScript 中是允许的。但是这样的结果就是，如果使用`Auto Decimal`的话，可能你的项目会无法运行，因为`decimal.js`是计算数字的，而不是计算其他的。

另外因为 JavaScript 的灵活性，也造成了无法解析 “+” 是加法还是字符串拼接，所以要用 `tailPatchZero` 这个配置项来解决这个问题。
::: tip
在新的项目中，提倡使用字符串模板来进行拼接组合字符串，这样就可以拿掉这个心智负担了。可以尽情的写计算而不用担心精度问题。
:::

`tailPatchZero` 就是在计算表达式的末位手动添加一个 `+ 0 `来告诉 `Auto Decimal`，这是一个计算表达式，你可以尽情的转换不用担心 `decimal.js` 会报错。

```ts { 5,14-15,18-19,22-23 }
// vite.config.ts
export default defineConfig({
  plugins: [
    AutoDecimal({
      tailPatchZero: true
    })
  ]
})

// ...someone.ts
const a = 0.1
const b = 0.2
// 已经启用了末位补 0 ,这样的计算表达式不会进行转换
const c = a + b
console.log(c, '0.30000000000000004')

// 通过末位补 0 , 告诉 Auto Decimal 它是可以转换的
const d = a + b + 0
console.log(d, '0.3')

// 当然这种是不需要 + 0 的
const e = 0.1 + 0.2
console.log(e, '0.3')
```
:::tip
`tailPatchZero` 只会影响加法的转换，其他的运算可以忽略它，另外只有在末位是加法的表达式才会跳过转换
:::