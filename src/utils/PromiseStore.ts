import HashMap from "./HashMap";

export default class PromiseStore<K, V> {
  private cancelCycle: number;
  private promises: HashMap<K, Promise<V>>;
  constructor(hash: (k: K) => string) {
    this.promises = new HashMap(hash);
    this.cancelCycle = 0;
  }
  get(key: K) {
    return this.promises.get(key);
  }
  add(key: K, promise: Promise<V>, onSuccess: (v: V) => void) {
    const currentCycle = this.cancelCycle;
    this.promises.set(
      key,
      promise.then((result) => {
        this.promises.delete(key);
        if (this.cancelCycle <= currentCycle) {
          onSuccess(result);
        }
        return result;
      })
    );
  }
  clear(): void {
    this.cancelCycle++;
    this.promises.clear();
  }
}
