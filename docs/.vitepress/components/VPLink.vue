<!--
 * @Date: 2026-09-05 13:52:03
 * @Author: lyumg
 * @FilePath: /unplugin-auto-decimal/docs/.vitepress/components/VPLink.vue
-->
<script lang="ts" setup>
import { useData } from 'vitepress'
import { computed } from 'vue'
import { isLinkExternal, normalizeLink } from '../utils/sidebar'

const props = withDefaults(defineProps<{
  tag?: string
  href?: string
  noIcon?: boolean
  external?: boolean
  target?: string
  rel?: string
}>(), {
  external: undefined,
})
const { site } = useData()
const tag = computed(() => props.tag ?? (props.href ? 'a' : 'span'))
const isExternal = computed(() =>
  isLinkExternal(props.href, props.target, props.external),
)
function normalize(href: string) {
  return normalizeLink(href, site)
}
</script>

<template>
  <component
    :is="tag"
    class="VPLink"
    :class="{
      'link': href,
      'vp-external-link-icon': isExternal,
      'no-icon': noIcon,
    }"
    :href="href ? normalize(href) : undefined"
    :target="target ?? (isExternal ? '_blank' : undefined)"
    :rel="rel ?? (isExternal ? 'noreferrer' : undefined)"
  >
    <slot />
  </component>
</template>
