<template>
	<div>
    <div :title="0.1+0.2">自己的:<br/>
			<!-- block-ad-ignore -->
			first => {{ 0.1 + 0.2 }}<span :title="0.1 + 0.2" style="color:red;">span => {{ 0.1 + 0.2 }}</span> second => {{ 0.1 + 0.2 }}
		</div>
		<br />
		<!-- <test>{{ 0.1 + 0.2 }}</test> -->
		<testJsx></testJsx>
	</div>
</template> 
<script>
import test from './components/test.vue'
import testJsx from './components/test-jsx.vue'
export default {
	data() {
		return {
			msg: 0
		}
	},
	components:{
		test,
		testJsx
	},
	created() {
		this.test();
		console.log(0.1 + 0.2, '123')
	},
	methods: {
		test() {
			const s = `${0.1+0.2}`
			console.log(s, 's22211')
		}
	}
}
</script>