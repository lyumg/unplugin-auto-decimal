<template>
  <div>test-num:{{ num }} 
    <span>
      slot:
      <slot></slot>
    </span>
    <!-- next-ad-ignore -->
    <div>自己的:{{ 0.1+0.2 }}</div>
  </div>
</template>
<script setup lang="ts">
withDefaults(defineProps<{num: number}>(), {
  num: 1
})
</script> 