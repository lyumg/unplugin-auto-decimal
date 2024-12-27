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
          slot =&gt;{ this.$slots.default?.()}
        </span>
        <div title={0.1 + 0.2}>自己的:<br/>
          {/* block-ad-ignore */}
          jsx first =&gt; { 0.1 + 0.2 }<span title={0.1 + 0.2} style="color:red;">span =&gt;{0.1 + 0.2}</span> jsx second =&gt; { 0.1 + 0.2 }
        </div>
      </div>
    )
  }
})
</script> 