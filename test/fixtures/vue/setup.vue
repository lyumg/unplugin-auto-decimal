<script setup lang="js">
const sum = ref(0.1 + 0.2)
const obj = {
  // next-ad-ignore
  a: 0.1 + 0.2,
}
function calc(a, b) {
  return a + b
}
calc(0.1, 0.2)
// block-ad-ignore
function _test() {
  return 0.1 + 0.2
}
</script>

<template>
  <div>
    {{ sum }}
    <div>transformed:{{ obj.a }} {{ 0.1 + 0.2 }}</div>
    <span>
      <!-- next-ad-ignore -->
      next-ad-ignore:{{ 0.1 + 0.2 }}
    </span>
    <!-- next-ad-ignore -->
    <p :skip-title="(0.1 + 0.2).toString()">
      next-ad-ignore transform: {{ 0.1 + 0.2 }}
    </p>
    <p>
      <!-- next-ad-ignore -->
      next-ad-ignore multiple:{{ 0.1 + 0.2 }} {{ 1 - 0.9 }}
    </p>
    <p>
      <!-- next-ad-ignore -->
      next-ad-ignore multiple skip:{{ 0.1 + 0.2 }}
      next-ad-ignore multiple transform: {{ 1 - 0.9 }}
    </p>
    <!-- block-ad-ignore -->
    <div style="color: red">
      block-ad-ignore:{{ 11.2 + 24.4 + 66 / (0.1 + 0.2) }}
    </div>
  </div>
  <Test :num="0.1 + 0.2">
    {{ 0.1 + 0.2 }}
    <!-- block-ad-ignore -->
    <Test :num="0.1 + 0.2">
      {{ 0.1 + 0.2 }}
    </Test>
  </Test>
  <RouterView />
</template>
