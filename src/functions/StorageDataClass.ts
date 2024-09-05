type dataType<T> = {
  endpoint?: string;
  data?: T;
}

export class StorageDataClass<T extends Object = {}> {
  version?: number;
  endpoint?: string;
  data?: T;
  key: string;
  constructor(key: string) {
    this.key = key;
  }
  getItem() {
    const storageValue = localStorage.getItem(this.key);
    const data = storageValue ? JSON.parse(storageValue) as dataType<T> : null;
    this.data = data?.data;
    this.endpoint = data?.endpoint;
    return data ?? {};
  }
  setItem(data: T, endpoint?: string, version?: number) {
    return localStorage.setItem(this.key, JSON.stringify({ endpoint, version, data }));
  }
  removeItem() {
    delete this.data;
    delete this.endpoint;
    localStorage.removeItem(this.key);
  }
}
