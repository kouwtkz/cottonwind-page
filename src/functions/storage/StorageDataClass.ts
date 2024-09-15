type dataType<T> = {
  version?: string;
  lastmod?: string;
  data?: T;
};

export class StorageDataClass<T extends Object = {}> {
  private version?: string;
  get Version() { return this.version }
  set Version(x) {
    if (x !== this.version) this.removeItem();
    this.version = x;
  }
  lastmod?: string;
  data?: T;
  key: string;
  /** @comment バージョンを変えると自動でデータを破棄して読み込み直すことができる */
  constructor(key: string, version?: string) {
    this.key = key;
    this.getItem();
    if (version) this.Version = version;
  }
  private __getItem() {
    const storageValue = localStorage.getItem(this.key);
    const data = storageValue
      ? (JSON.parse(storageValue) as dataType<T>)
      : null;
    return data ?? {};
  }
  getItem() {
    const data = this.__getItem();
    if (data) {
      this.data = data.data;
      this.lastmod = data.lastmod;
      this.version = data.version;
    }
    return data;
  }
  setItem(data: T, lastmod?: string) {
    return localStorage.setItem(
      this.key,
      JSON.stringify({ lastmod, version: this.version, data })
    );
  }
  removeItem() {
    delete this.data;
    delete this.lastmod;
    localStorage.removeItem(this.key);
  }
}
