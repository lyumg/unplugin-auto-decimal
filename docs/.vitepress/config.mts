/*
* @Date: 2026-01-26 10:15:45
* @Author: lyumg
 * @FilePath: /unplugin-auto-decimal/docs/.vitepress/config.mts
*/
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitepress'
import { groupIconMdPlugin, groupIconVitePlugin, localIconLoader } from 'vitepress-plugin-group-icons'
import { version } from '../../package.json'
import tag from './plugins/tag'
// https://vitepress.dev/reference/site-config
export default defineConfig({
  head: [[
    'link',
    { rel: 'icon', href: '/unplugin-auto-decimal/favicon.svg' },
  ]],
  title: 'AutoDecimal',
  description: 'A plugin that automatically converts basic operations in JavaScript to decimal.js methods',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      // { text: 'Home', link: '/' },
      { text: '指南', link: '/guide/what-is-auto-decimal' },
      {
        text: version,
        items: [{
          text: 'Release Notes',
          link: 'https://github.com/lyumg/unplugin-auto-decimal/releases',
        }],
      },
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
            { text: 'includes/excludes ^(1.5.0)', link: '/guide/api/includes' },
            { text: 'tailPatchZero', link: '/guide/api/tail-patch-zero' },
            { text: 'supportString', link: '/guide/api/support-string' },
            { text: 'toDecimal ^(1.2.0)', link: '/guide/api/to-decimal' },
            { text: 'supportNewFunction ^(1.4.0)', link: '/guide/api/new-function' },
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
    resolve: {
      alias: [
        {
          find: /^.*\/VPSidebar\.vue$/,
          replacement: fileURLToPath(
            new URL('./components/VPSidebar.vue', import.meta.url),
          ),
        },
        {
          find: /^.*\/VPDocFooter\.vue$/,
          replacement: fileURLToPath(
            new URL('./components/VPDocFooter.vue', import.meta.url),
          ),
        },
      ],
    },
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
