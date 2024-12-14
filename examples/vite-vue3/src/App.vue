<script setup lang="js">
import { ref } from 'vue'
import Test from './components/test.vue'
const s = ref(0.1 + 0.2)
const b = s.value - 0.2
const a = ref((0.1 + 0.2) * (s.value - 0.1) + s.value - 0.6 + 7)
</script>

<template>
  <div>
    s:{{ s }}
    a:{{ a }}
    <Test>{{ 0.1 + 0.2  }}</Test>
    <RouterView />
  </div>
</template>
