<template>
	<div>
    <div :title="0.1 + 0.2"> a:{{ 0.1 + 0.2 }} b:{{ 0.1 + 0.2 }}</div>
	</div>
</template> 
<script>
export default {
	data() {
		return {
			msg: 0
		}
	},
	created() {
		this.test();
	},
	methods: {
		test() {
			// block-ad-ignore
			const s = `${0.1+0.2}`
			console.log(s, 's22211')
		}
	}
}
</script>