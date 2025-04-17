# AutoDecimal 是什么？

`AutoDecimal` 是一个基于 [`unplugin`](https://unplugin.unjs.io/) 构建的自动转换插件，能够自动将 JavaScript 中的加、减、乘、除转换为 [`decimal.js`](https://mikemcl.github.io/decimal.js/) 中的方法，从而避免手动转换所带来的种种不便。

## 使用场景

- 当你的项目中需要高精度的计算
- 当你使用高精度计算库，厌倦了每个计算都要手动引用并转换成该库的方法
- 当你想要美观且直白的运算，同时又不想被计算所造成的精度所困扰

## 开发体验

`AutoDecimal` 让你在编写代码时可以像往常一样使用基本运算符。它会在构建时自动处理转换，无需手动修改每一行代码。这种自动化的过程大大减少了开发时间和精力。

- 基于拥有广大用户稳定且开源的高精度库 `decimal.js`
- 基于为各种构建工具提供统一插件的 `unplugin`

**未使用 `AutoDecimal` 时**

```js{4}
const num = 0.1
const otherNum = 0.2
const sum = num + otherNum
console.log(sum, '输出0.30000000000000004')
```

**使用 `AutoDecimal` 后**

```js{4}
const num = 0.1
const otherNum = 0.2
const sum = num + otherNum
console.log(sum, '输出0.3')
```

### 两个字 `完美`