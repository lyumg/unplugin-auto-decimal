---
outline: deep
---

# 快速开始

## 安装

:::tip
插件依赖于 `decimal.js-light`，如果当前项目中已经使用了`decimal.js`、 `decimal.js-light`、 `big.js`, 其中任意一个，可以通过 `package` 来指定使用哪个库，不用重复安装。
:::

:::code-group

```zsh [npm]
npm install -D unplugin-auto-decimal
# 已经安装过的可以跳过
npm install -S decimal.js-light
```

```zsh [pnpm]
pnpm add -D unplugin-auto-decimal
# 已经安装过的可以跳过
pnpm add -S decimal.js-light
```

```zsh [yarn]
yarn add -D unplugin-auto-decimal
# 已经安装过的可以跳过
yarn add -S decimal.js-light
```

:::

## 配置
:::code-group

```ts [Vite]
// vite.config.ts
import AutoDecimal from 'unplugin-auto-decimal/vite'
export default defineConfig({
  plugins: [AutoDecimal({
    /** options */
  })]
})

```

```js [Rspack]
// rspack.config.ts
const AutoDecimal = require('unplugin-auto-decimal/rspack')
module.exports = {
  /* ...  */
  tools: {
    rspack: {
      plugins: [AutoDecimal(
        /** options */
      )]
    }
  }
}

```

```js [Webpack]
// webpack.config.js
module.exports = {
  /* ...  */
  plugins: [require('unplugin-auto-decimal/webpack')({
      /* options */
    }),
  ],
}

```

```js [Vue-CLI]
// vue.config.js
module.exports = {
  configureWebpack: {
    plugins: [
      require('unplugin-auto-decimal/webpack')({
        /* options */
      }),
    ],
  },
}

```

:::
:::warning
如果是 React 的话，必须将 `AutoDecimal` 放在 React 前面。
:::
```ts
// vite.config.ts
import AutoDecimal from 'vite-plugin-auto-decimal'
import React from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [AutoDecimal(), React()],
})
