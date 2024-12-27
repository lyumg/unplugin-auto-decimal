<template>
	<div>
    <div :title="0.1+0.2"> a:{{ 0.1 + 0.2 }} b:{{ 0.1 + 0.2 }}</div>
		<test>{{ 0.1 + 0.2 }}</test>
		<testJsx>
			<!-- next-ad-ignore -->
			{{ 0.1 + 0.2 }} <span>span: {{ 0.1 + 0.2 }}</span> {{ 0.1 + 0.2 }}
		</testJsx>
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