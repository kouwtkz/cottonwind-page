type dataType<T> = {
  version?: string;
  endpoint?: string;
  data?: T;
};

export class StorageDataClass<T extends Object = {}> {
  version?: string;
  endpoint?: string;
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
    this.endpoint = data?.endpoint;
    return data;
  }
  setItem(data: T, endpoint?: string) {
    return localStorage.setItem(
      this.key,
      JSON.stringify({ endpoint, version: this.version, data })
    );
  }
  removeItem() {
    delete this.data;
    delete this.endpoint;
    localStorage.removeItem(this.key);
  }
}
