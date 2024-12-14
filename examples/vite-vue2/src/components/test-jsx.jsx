export default {
  name: 'TestJsx',
  data() {
    return {
      num: 0.1+0.2
    }
  },
  render() {
    return  (
      <div style="color: red;">
      <div>自己的:{this.num}</div>
      {/* next-ad-ignore */}
      <div>slot:{this.$slots.default}</div>
    </div>
    )
  }
}