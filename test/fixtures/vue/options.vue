<script>
export default {
  data() {
    return {
      msg: 0,
    }
  },
  created() {
    this.test()
  },
  methods: {
    test() {
      const _s = `${0.1 + 0.2}`
      // next-ad-ignore
      const _sum = 0.1 + 0.2
      // block-ad-ignore
      {
        const _a = 0.1 + 0.2
        const _obj = { a: 0.1 + 0.2 }
      }
    },
  },
}
</script>

<template>
  <div>
    <div :title="0.1 + 0.2">
      transform:{{ 0.1 + 0.2 }} b:{{ 1 - 0.9 }}
    </div>
    <!-- next-ad-ignore -->
    <span :title="0.1 + 0.2">
      next-ad-ignore transform:{{ 0.1 + 0.2 }}
    </span>
    <a :title="0.1 + 0.2">
      <!-- next-ad-ignore -->
      next-ad-ignore:{{ 0.1 + 0.2 }}
    </a>
    <div :title="0.1 + 0.2">
      <!-- next-ad-ignore multiple -->
      multiple skip:{{ 0.1 + 0.2 }} {{ 0.2 + 0.1 }}
      multiple transform:{{ 1 - 0.9 }}
    </div>
    <!-- block-ad-ignore -->
    <p :block-title="0.1 + 0.2">
      block-ad-ignore:{{ 0.1 + 0.2 }}
    </p>
  </div>
</template>
