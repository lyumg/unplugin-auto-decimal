@Log
export class Test {
  @Field
  field = 0.1 + 0.2
}
function Field(_target: Test, _propertyKey: string): void {

}
function Log(_target: typeof Test): void {

}
