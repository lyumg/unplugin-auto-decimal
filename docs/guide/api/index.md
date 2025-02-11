# 配置选项

`Auto Decimal` 为了提供良好的开发体验，提供了几个 API 来让你尽量使用的没有心智负担。但是世上总是没有尽善尽美的事情，所以有一些配置，你是需要知道的。

如果你是想要在一个即将开始的项目中使用的话，下面的几个配置项是可以跳过的。

| 属性               | 描述     | 类型     | 默认值     | 
| ----------------  | :------: | :------: |:------: |
| [`tailPatchZero`](./tail-patch-zero.md) | 区分计算表达式和字符串拼接 | boolean | false | 
| [`supportString`](./support-string.md) | 支持字符串计算 | boolean | false |
| package | 高精度计算库 | `decimal.js`、`decimal.js-light`、`big.js` | `decimal.js-light` |
| [`toDecimal`](./to-decimal.md) ^(1.2.0) | 使用 `toDecimal` 进行转换 | boolean \| ToDecimalConfig  | false |
| dts ^(1.2.0) | 生成.d.ts 文件。 如果已经安装了 `typescript`，默认为 true | boolean \| string | -- |