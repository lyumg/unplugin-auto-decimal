<script setup lang="ts">
import * as D from 'decimal.js-light'
import { ref } from 'vue'

withDefaults(defineProps<{ num: number }>(), {
  num: 1,
})
const a = ref(0.1)
const b = ref(0.2)
console.log(new D.Decimal(1).sub(0.9).toNumber())
</script>

<template>
  <div>
    test-num:{{ num }}
    <span>
      slot:
      <slot />
    </span>
    <!-- next-ad-ignore -->
    <div>自己的:{{ a + b }}</div>
  </div>
</template>
