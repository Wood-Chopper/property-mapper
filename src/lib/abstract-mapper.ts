export abstract class AbstractMapper<S, T> {
  map(s: S, ...args: any[]): T {
    return s as unknown as T;
  }
  arrayMap(s: S[], ...args: any[]): T[] {
    return s.map(v => this.map(v, ...args)) as T[];
  }
}
