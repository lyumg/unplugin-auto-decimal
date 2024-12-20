# 跳过转换

有的时候，有些计算是不需要转换的。那么要如何跳过某个计算表达式或者都跳过呢？

- 添加相应的注释（`jsx` 中需要注意, 在表达式中一些情况下是需要使用 JavaScript 注释）
- `supportString: true`时, 末尾拼接一个空字符串
- `supportString: false`时, 末尾拼接任意字符串


#### [末位拼接空字符串](splicing.md)


####  [添加相应的注释](ad-ignore.md)