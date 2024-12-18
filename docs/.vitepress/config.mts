import { defineConfig } from 'vitepress'
import { groupIconMdPlugin, groupIconVitePlugin, localIconLoader } from 'vitepress-plugin-group-icons'
// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Auto Decimal',
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
      formatOptions: {
        hourCycle: 'h24',
        dateStyle: 'full',
        hour: '2-digit',
      },
    },

    sidebar: [
      {
        text: '参考',
        items: [
          { text: '什么是 Auto Decimal？', link: '/guide/what-is-auto-decimal' },
          { text: '快速开始', link: '/guide/getting-started' },
          { text: '配置选项', link: '/guide/api', items: [
            { text: 'tail patch zero', link: '/guide/api/tail-patch-zero' },
            { text: 'support string', link: '/guide/api/support-string' },
          ] },
          { text: '跳过转换', link: '/guide/comment', items: [
            { text: 'splicing', link: '/guide/comment/splicing' },
            { text: 'comment', link: '/guide/comment/ad-ignore' },
          ] },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' },
    ],
  },
  base: '/unplugin-auto-decimal',
  lastUpdated: true,
  markdown: {
    config: (md) => {
      md.use(groupIconMdPlugin)
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
