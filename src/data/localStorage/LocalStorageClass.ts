export class LocalStorageClass<T> {
  data?: T;
  key: string;
  constructor(key: string) {
    this.key = key;
    this.getItem();
  }
  private __getItem() {
    const storageValue = localStorage.getItem(this.key);
    const data = storageValue
      ? (JSON.parse(storageValue) as T)
      : null;
    return data;
  }
  getItem() {
    const data = this.__getItem();
    if (data) {
      this.data = data;
    }
    return data;
  }
  setItem(data: T) {
    this.data = data;
    return localStorage.setItem(
      this.key,
      JSON.stringify(data)
    );
  }
  removeItem() {
    delete this.data;
    localStorage.removeItem(this.key);
  }
}
