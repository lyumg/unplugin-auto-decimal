/*
 * @Date: 2026-09-05 14:14:54
 * @Author: lyumg
 * @FilePath: /unplugin-auto-decimal/docs/.vitepress/composables/layout.ts
 */
import type { DefaultTheme } from 'vitepress/theme'
import { useMediaQuery } from '@vueuse/core'
import { useData } from 'vitepress'
import {
  computed,
  shallowReadonly,
  shallowRef,
  watch,
} from 'vue'
import { getSidebar, getSidebarGroups } from '../utils/sidebar'

const sidebar = shallowRef<DefaultTheme.SidebarItem[]>([])

const isDesktop = useMediaQuery('(min-width: 60rem)')

export function useLayout() {
  const { frontmatter, theme, page } = useData()
  watch(
    () => [page.value.relativePath, theme.value.sidebar] as const,
    ([relativePath, sidebarConfig]) => {
      const newSidebar = sidebarConfig
        ? getSidebar(sidebarConfig, relativePath)
        : []
      if (JSON.stringify(newSidebar) !== JSON.stringify(sidebar.value)) {
        sidebar.value = newSidebar
      }
    },
    { immediate: true, deep: true, flush: 'sync' },
  )

  const isHome = computed(() => {
    return !!(frontmatter.value.isHome ?? frontmatter.value.layout === 'home')
  })

  const hasSidebar = computed(() => {
    return (
      frontmatter.value.sidebar !== false
      && sidebar.value.length > 0
      && !isHome.value
    )
  })

  const isSidebarEnabled = computed(() => hasSidebar.value && isDesktop.value)

  const sidebarGroups = computed(() => {
    return hasSidebar.value ? getSidebarGroups(sidebar.value) : []
  })

  const hasAside = computed(() => {
    if (isHome.value)
      return false
    if (frontmatter.value.aside != null)
      return !!frontmatter.value.aside
    return theme.value.aside !== false
  })

  const leftAside = computed(() => {
    if (!hasAside.value)
      return false
    return frontmatter.value.aside == null
      ? theme.value.aside === 'left'
      : frontmatter.value.aside === 'left'
  })

  return {
    isHome,
    sidebar: shallowReadonly(sidebar),
    sidebarGroups,
    hasSidebar,
    isSidebarEnabled,
    hasAside,
    leftAside,
  }
}
