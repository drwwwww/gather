export function assertDefined<T>(v: T, name: string): asserts v is NonNullable<T> {
  if (v == null) throw new Error(`${name} is undefined/null`);
}