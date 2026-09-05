/*
 * @Date: 2026-09-05 13:57:14
 * @Author: lyumg
 * @FilePath: /unplugin-auto-decimal/docs/.vitepress/composables/sidebar.ts
 */
import type { DefaultTheme } from 'vitepress'
import type { ComputedRef } from 'vue'
import { useData, useRoute } from 'vitepress'
import { computed, nextTick, onMounted, ref, watch, watchEffect } from 'vue'
import { containsActiveLink, isActive } from '../utils/sidebar'

type SidebarItem = DefaultTheme.SidebarItem
export function useSidebarItemControl(
  item: ComputedRef<SidebarItem>,
) {
  const route = useRoute()

  const collapsed = ref(false)
  const { site } = useData()

  const collapsible = computed(() => {
    return item.value.collapsed != null
  })

  const isLink = computed(() => {
    return !!item.value.link
  })

  const isActiveLink = ref(false)
  const hasActiveLink = ref(false)

  function updateActiveLink(skipHashCheck = false): void {
    if (item.value.link) {
      isActiveLink.value = isActive(
        route.data.relativePath,
        (route as any).hash,
        item.value.link,
        false,
        skipHashCheck,
        site,
      )
    }
    else {
      isActiveLink.value = false
    }
    if (isActiveLink.value) {
      hasActiveLink.value = true
      nextTick(() => (collapsed.value = false))
      return
    }
    if (!item.value.items) {
      hasActiveLink.value = false
      return
    }
    hasActiveLink.value = containsActiveLink(
      route.data.relativePath,
      (route as any).hash,
      item.value.items,
      skipHashCheck,
      site,
    )
    if (hasActiveLink.value) {
      nextTick(() => (collapsed.value = false))
    }
  }

  updateActiveLink(true)

  watch([item, route], () => updateActiveLink())
  onMounted(() => updateActiveLink())

  const isCurrentLink = computed(() => {
    return item.value.link
      ? isActive(route.data.relativePath, (route as any).hash, item.value.link, false, false, site)
      : false
  })

  const hasChildren = computed(() => {
    return !!(item.value.items && item.value.items.length)
  })

  watchEffect(() => {
    collapsed.value = !!(collapsible.value && item.value.collapsed)
  })

  function toggle(): void {
    if (collapsible.value) {
      collapsed.value = !collapsed.value
    }
  }

  return {
    collapsed,
    collapsible,
    isLink,
    isActiveLink,
    isCurrentLink,
    hasActiveLink,
    hasChildren,
    toggle,
  }
}
