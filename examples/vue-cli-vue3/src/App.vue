<template>
	<div>
    <div :title="0.1+0.2"> a:{{ 0.1 + 0.2 }} b:{{ 0.1 + 0.2 }}</div>
	</div>
</template> 
<script>
import test from './components/test.vue'
export default {
	data() {
		return {
			msg: 0
		}
	},
	components:{
		test,
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