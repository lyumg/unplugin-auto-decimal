// eslint-disable-next-line ts/ban-ts-comment
// @ts-nocheck
/* eslint-disable no-console */
/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable no-new-func */
const fn = new Function('a', 'b', `return a + b`)
const result = fn(0.1, 0.2)
let fnTxt = ''
fnTxt = '1'
fnTxt = 'return a + b'
if (true) {
  fnTxt = 'return a + b + 1'
}
else {
  fnTxt = 'return a + b + 0'
}
const returnValue = () => 'return a + b + 3'
function returnValue2() {
  return 'return a + b + 4..toDecimal()'
}
fnTxt = returnValue()
function run(num: any, params: any) {
  console.log('inner, toDecimal: true, ', num, ' + 0.2;', fnTxt)
  const arr = [1, new Function('a', 'b', params)]
  const obj = { b: new Function('a', 'b', params) }
  const fn = new Function('a', 'b', params)
  console.log('obj.b', obj.b(num, 0.2))
  // @ts-expect-error array new Function
  console.log('arr[1]', arr[1](0.1, 0.2))
  const callFn = fn(num, 0.2)
  console.log(callFn, 'callFn')
}
run('12', fnTxt)
fnTxt = returnValue2()
run('12', fnTxt)
