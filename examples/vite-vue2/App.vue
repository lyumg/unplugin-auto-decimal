<script lang="jsx">
import test from './src/components/test.vue'
import testJsx from './src/components/test-jsx'
// import * as D from 'decimal.js-light'
export default {
  components: {
    Test: test,
    TestJsx: testJsx,
  },
  data() {
    return {
      msg: 0,
      a: 0.1,
    }
  },
  created() {
    this.test()
    // next-ad-ignore
    ;(function ast(params) {
      console.log('122323', params)
      // next-ad-ignore
    }(0.1 + 0.2))
  },
  methods: {
    test() {
      const s = `${this.a + 0.2 + 0}`
      console.log(s, 's22211')
    },
  },
  render() {
    return (
      <div>
        {/* next-ad-ignore */}
        <test title={0.1 + 0.2}>{0.1 + 0.2}</test>
        <div>
          This is Vue2
          { this.msg }
        </div>
        <div>
          This is Vue2
          { this.msg }
          {`${0.1 + 0.2}` }
        </div>
        {/* next-ad-ignore */}
        <div> 0.1 - 0.2  / 1 </div>
      </div>
    )
  },
}
</script>
