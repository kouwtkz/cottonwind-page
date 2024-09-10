type dataType<T> = {
  version?: string;
  lastmod?: string;
  data?: T;
};

export class StorageDataClass<T extends Object = {}> {
  version?: string;
  lastmod?: string;
  data?: T;
  key: string;
  /** @comment バージョンを変えると自動でデータを破棄して読み込み直すことができる */
  constructor(key: string, version?: string | number) {
    this.key = key;
    this.version = version ? String(version) : undefined;
    const got = this.getItem();
    if (this.version !== got.version) this.removeItem();
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
    this.data = data?.data;
    this.lastmod = data?.lastmod;
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
