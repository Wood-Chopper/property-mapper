export function removeFirst<T>(sourceMapping: T[]): T[] {
  let copy = [...sourceMapping];
  copy.shift();
  return copy;
}
