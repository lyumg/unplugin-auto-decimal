# 跳过转换
有时候，有些计算其实是不需要转换的。那么要如何跳过某个计算表达式或者都跳过呢？

- 添加相应的注释（`jsx` 中需要注意, 在表达式中某些情况可能需要使用 JavaScript 注释）
- 添加 `ad-ignore` prop
- `supportString: true`时, 末尾拼接一个空字符串
- `supportString: false`时, 末尾拼接任意字符串

## script

当你想跳过某个计算表达式，不需要转换时，可以使用 `next-ad-ignore`:

```ts
// next-ad-ignore
const igSum = 0.1 + 0.2;
console.log('igSum => ', igSum); // 0.30000000000000004

// 注释在右侧
const igSumStrDirection = 0.1 + 0.2 // next-ad-ignore
console.log('igSumStrDirection => ', igSumStrDirection); // '0.30000000000000004'

// 末尾拼接一个空字符串
const igSumStr = 0.1 + 0.2 + '';
console.log('igSumStr => ', igSumStr); // '0.30000000000000004'
```

如果你想在某个作用域内，所有计算表达式都不进行转换的话，使用 `block-ad-ignore`:

```ts
const sum = 0.1 + 0.2
console.log('sum => ', sum) // 0.3

const sumStr = 0.1 + 0.2 + ''
console.log('sumStr => ', sumStr) // '0.30000000000000004'
...
// block-ad-ignore
{
  const igSum = 0.1 + 0.2
  console.log('igSum => ', igSum) // 0.30000000000000004

  const sum = 0.1 + 0.2
  console.log('sum => ', sum) // 0.30000000000000004
}

function sum() {
  const sum = 0.1 + 0.2
  console.log('sum => ', sum) // 0.3

  const sumStr = 0.1 + 0.2 + ''
  console.log('sum => ', sum) // '0.30000000000000004'
}
sum()

// block-ad-ignore
function igSumFn() {
  const igSum = 0.1 + 0.2
  console.log('sum => ', sum) // 0.30000000000000004
}
igSumFn()
```

如果某个文件内的计算表达式都不需要转换的话，可以在文件顶部使用 `file-ad-ignore`:

```ts
// file-ad-ignore
...
const igSum = 0.1 + 0.2
console.log('igSum => ', igSum) // 0.30000000000000004

const igSum2 = 0.1 + 0.2
console.log('igSum2 => ', igSum2) // 0.30000000000000004
```

## vue template

如果想只禁用 `template` 内的计算表达式的话，在 `template` 标签添加 `ad-ignore` prop 即可。

```vue
<!-- 在根 template 中添加 ad-ignore。这样的话，template 中所有的计算都不会转换 -->
<template ad-ignore>
    ...something
</template>
```

`ad-ignore` 只影响在 `template` 中定义的计算表达式是否转换, 不会影响到 `script` 中定义的计算表达式。
```vue
<template ad-ignore>
  <!-- title="0.30000000000000004" -->
  <div :title="0.1+0.2">
    <!-- ad-ignore 不会影响到在 script 中定义的变量 -->
    <!-- title="0.3" -->
    <div :title="num.toString()">
    </div>
  </div>
</template>
<script setup>
  const num = ref(0.1+0.2)
</script>
```

在 `template` 中, 可以使用 `next-ad-ignore` 和 `block-ad-ignore`，也需要区分两种注释。

- `next-ad-ignore` 用于组件 `prop` 和绑定的各个参数, 但不包含插槽与子集
- `block-ad-ignore` 用于控制整个组件的所有属性包括插槽及子集

```html
<template>
  <div>
    <!-- next-ad-ignore title="0.30000000000000004" alt="getAlt(0.30000000000000004)" -->
    <div :title="0.1 + 0.2" :alt="getAlt(0.1 + 0.2)">
      <!-- 0.3 -->
      <div>
        {{ 0.1 + 0.2 }}
      </div>
    </div>
    <!-- block-ad-ignore title="0.30000000000000004" -->
    <div :title="0.1 + 0.2">
      <!-- 0.30000000000000004 -->
      <div>{{ 0.1 + 0.2 }}</div>
    </div>
    <!-- title="0.3" -->
    <div :title="0.1 + 0.2">
      <!-- next-ad-ignore 0.30000000000000004 -->
      {{ 0.1 + 0.2 }}
      <!-- block-ad-ignore title="0.30000000000000004" -->
      <div :title="0.1 + 0.2">
        <!-- 0.3 -->
        {{ 0.1 + 0.2 }}
      </div>
    </div>
  </div>
</template>
<script setup>
function getAlt(value) {
  // 0.30000000000000004
  console.log(value)
}
</script>
```

## jsx

```tsx
import OtherComponent from '..'
render() {
  const list = Array.from({ length: 3 }, item => 0.1)
  return (<div>
    {
      /* 
      * next-ad-ignore
      * next-ad-ignore 不负责插槽和子集
      * 所以 title=0.30000000000000004
      * jsx comment: 0.3
      */
    }
    <div title={0.1 + 0.2}>jsx comment: {0.1 + 0.2}</div>

    {/* 0.30000000000000004 */}
    <div>拼接空字符串: {0.1 + 0.2 + ''}</div>
    
    {/* 0.3 */}
    <div>正常输出: {0.1 + 0.2}</div>
    {
      /**
      * block-ad-ignore
      * 组件中所有的属性都不会转换
      * num=0.30000000000000004
      */
    }
    <OtherComponent num={0.1 + 0.2} >
      {/* slot 0.30000000000000004 */}
      {0.1 + 0.2}
      {/* num=0.30000000000000004 */}
      <OtherComponent num={0.1 + 0.2}>
        {/* slot 0.30000000000000004 */}
        {0.1 + 0.2}
      </OtherComponent>
    </OtherComponent>
    {
      list.map(item => {
        {/* 这里要注意使用 Javascript 中的注释形式, 不能使用 jsx 中的注释形式 */}
        {/* 这里要注意使用 Javascript 中的注释形式, 不能使用 jsx 中的注释形式 */}
        {/* 这里要注意使用 Javascript 中的注释形式, 不能使用 jsx 中的注释形式 */}
        
        {/* 所以这种是不生效的 next-ad-ignore */}
        const sum = 0.1 + 0.2
        console.log('sum => ', sum) // 0.3
        // 这种是生效的 next-ad-ignore <div style="color: red;">0.30000000000000004</div>
        return <div style="color: red;">{item + 0.2}</div>
      })
    }
  </div>)
}
```