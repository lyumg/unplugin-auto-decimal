<script setup lang="js">
import { ref } from 'vue'
import Test from './components/test.vue'
const s = ref(0.1 + 0.2)
const b = (0.1111 + 0.2222)
const a = ref((0.1 + 0.2) * (s.value - 0.1) + s.value - 0.6 + 7)
const fn = new Function('a', 'b',`return a + b`)
const result = fn(0.1, 0.2)
var fnTxt = '';
  fnTxt = '1'
  console.log('outer', 0.1 + 0.2)
  fnTxt = 'return a + b'
  function test() {
    const a = () => 'return a + b + 2'
    const s = a()
    fnTxt = s
  }
  const returnValue = () => 'return a + b + 3'
  function returnValue2() {
    return 'return a + b + 4'
  }
  fnTxt = returnValue()
  function run(num, params) {
    console.log('inner, toDecimal: true, ', num, ' + 0.2;', fnTxt)
    // const arr = [1, Function('a', 'b', params)]
    // const obj = {b:Function('a', 'b', params) }
    const fn = Function('a', 'b', params)
    // console.log('obj.b', obj.b(num, 0.2))
    // console.log('arr[1]', arr[1](0.1, 0.2))
    const result = fn(num, 0.2)
    console.log(result, 'result')
  }
  run('12', fnTxt)
  fnTxt = returnValue2()
  run('12', fnTxt)
console.log("🚀 -----------------------------------------🚀")
console.log("🚀 | file: App.vue:11 | result => ", result)
console.log("🚀 -----------------------------------------🚀")

</script>

<template>
  <div>
    b: {{ b }}
    s:{{ s }}
    a:{{ a }}
    <Test>{{ 0.1 + 0.2 }}</Test>
    <RouterView />
  </div>
</template>
