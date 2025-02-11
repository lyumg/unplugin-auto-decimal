<script setup lang="js">
import { ref } from 'vue'
import Test from './components/test.vue'

const s = ref(0.1 + 0.2)
const b = (0.1111 + 0.2222).toDecimal({precision: 3, callMethod: 'toFixed', roundingModes: 'ROUND_UP'})
const a = ref((0.1 + 0.2) * (s.value - 0.1) + s.value - 0.6 + 7)
</script>

<template>
  <div>
    b: {{ b }}
    s:{{ s }}
    a:{{ a }}
    <Test>{{ 0.1 + 0.2 }}</Test>
    <RouterView />
  </div>
</template>
