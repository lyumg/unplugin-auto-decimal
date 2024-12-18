<script setup lang="ts">
import { ref } from 'vue'

const sum = ref(0.1 + 0.2)
// next-ad-ignore
const ignore = ref(0.1 + 0.2)
// tail patch zero
const tailPatchZero = ref(1 - 0.9 + 0.05 + 0.05)
const enabledTailPatchZero = ref(1 - 0.9 + 0.05 + 0.05 + 0)
</script>

<template>
  <div class="content">
    <h1>Rsbuild with Vue</h1>
    <div>auto decimal{{ 0.1 + 0.2 }}</div>
    <!-- block-ad-ignore -->
    <div>block-ad-ignore{{ 0.1 + 0.2 }}</div>
    <div>setup {{ sum }}</div>
    <div>setup ignore: {{ ignore }}</div>
    <div>disabled tail patch zero {{ tailPatchZero }}</div>
    <div>enabled tail patch zero {{ enabledTailPatchZero }}</div>
    <div>{{ '0.1' + '0.2' }}</div>
    <div>{{ sum === 0.3 ? 0.1 + 0.2 : 1 - 0.9 }}</div>
  </div>
</template>

<style scoped>
.content {
  display: flex;
  min-height: 100vh;
  line-height: 1.1;
  text-align: center;
  flex-direction: column;
  justify-content: center;
}

.content h1 {
  font-size: 3.6rem;
  font-weight: 700;
}

.content p {
  font-size: 1.2rem;
  font-weight: 400;
  opacity: 0.5;
}
</style>
