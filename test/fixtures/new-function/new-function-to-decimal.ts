/* eslint-disable no-console */
/* eslint-disable no-new-func */
let fnString = ''
const returnedValue = () => 'return a + b + 3'
function returnedValue2() {
  return 'return a + b + 4..toDecimal()'
}
fnString = returnedValue()
function runFn(num: any, params: any) {
  console.log('inner, toDecimal: true, ', num, ' + 0.2;', fnString)
  const arr = [1, new Function('a', 'b', params)]
  const obj = { b: new Function('a', 'b', params) }
  const fn = new Function('a', 'b', params)
  console.log('obj.b', obj.b(num, 0.2))
  // @ts-expect-error array new Function
  console.log('arr[1]', arr[1](0.1, 0.2))
  const callFn = fn(num, 0.2)
  console.log(callFn, 'callFn')
}
runFn('12', fnString)
fnString = returnedValue2()
runFn('12', fnString)
