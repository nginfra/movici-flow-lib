export default class HashMap<K, V> {
  private store: Record<string, V>;
  private hash: (k: K) => string;
  constructor(hash: (k: K) => string) {
    this.store = {};
    this.hash = hash;
  }

  get(key: K): V | null {
    return this.store[this.hash(key)] ?? null;
  }
  set(key: K, val: V) {
    this.store[this.hash(key)] = val;
  }
  delete(key: K) {
    delete this.store[this.hash(key)];
  }
  clear() {
    this.store = {};
  }
}
