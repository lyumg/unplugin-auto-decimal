<script lang="jsx">
import { defineComponent } from 'vue'
export default defineComponent({
  name: 'TestJsx',
  props: {
    num: [Number, String]
  },
  render() {
    return (
      <div>test-jsx-num:{ this.num } 
        <span>
          { this.$slots.default()}
        </span>
        <div>自己的:<br/>
          {/* next-ad-ignore */}
          16: { 0.1 + 0.2 } 17: { 0.1 + 0.2 }
          </div>
      </div>
    )
  }
})
</script> 