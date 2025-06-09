import { defineConfig } from 'vitepress'
import { groupIconMdPlugin, groupIconVitePlugin, localIconLoader } from 'vitepress-plugin-group-icons'
import tag from './plugins/tag'
// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'AutoDecimal',
  description: 'A plugin that automatically converts basic operations in JavaScript to decimal.js methods',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      // { text: 'Home', link: '/' },
      { text: '指南', link: '/guide/what-is-auto-decimal' },
    ],
    logo: {
      light: '/logo.svg',
      dark: '/logo.svg',
    },
    lastUpdated: {
      text: '最后更新于',
    },

    sidebar: [
      {
        text: '参考',
        items: [
          { text: '什么是 AutoDecimal？', link: '/guide/what-is-auto-decimal' },
          { text: '快速开始', link: '/guide/getting-started' },
          { text: '配置选项', link: '/guide/api', items: [
            { text: 'tailPatchZero', link: '/guide/api/tail-patch-zero' },
            { text: 'supportString', link: '/guide/api/support-string' },
            { text: 'toDecimal', link: '/guide/api/to-decimal' },
            { text: 'supportNewFunction', link: '/guide/api/new-function' },
          ] },
          { text: '跳过转换', link: '/guide/comment', items: [
            { text: 'splicing', link: '/guide/comment/splicing' },
            { text: 'comment', link: '/guide/comment/ad-ignore' },
          ] },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/lyumg/unplugin-auto-decimal' },
    ],
  },
  base: '/unplugin-auto-decimal',
  lastUpdated: true,
  markdown: {
    config: (md) => {
      md.use(groupIconMdPlugin)
      md.use(tag)
    },
  },
  vite: {
    plugins: [
      // @ts-expect-error plugins
      groupIconVitePlugin({
        customIcon: {
          rspack: localIconLoader(import.meta.url, './assets/rspack.svg'),
        },
      }),
    ],
  },
})
