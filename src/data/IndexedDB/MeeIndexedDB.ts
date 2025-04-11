import { findMeeSort, findMeeWheresFilter } from "@/functions/find/findMee";

export class MeeIndexedDB implements Props_MeeIndexedDB {
  db?: IDBDatabase;
  dbName: string;
  version?: number;
  forceDeleteDatabase?: boolean;
  onupgradeneeded?: onupgradeneededFunction;
  onsuccess?: onsuccessFunction;
  static asyncRequest<R>(request: IDBRequest<R>) {
    return new Promise<R>((res, rej) => {
      request.onerror = () => {
        rej(e);
      };
      request.onsuccess = (e) => {
        res(request.result);
      };
    });
  }
  async deleteDatabase() {
    return MeeIndexedDB.asyncRequest(indexedDB.deleteDatabase(this.dbName));
  }
  close() {
    this.db?.close();
  }
  setDB() {
    return new Promise<void>(async (res, rej) => {
      if (this.forceDeleteDatabase) await this.deleteDatabase();
      const request = indexedDB.open(this.dbName, this.version);
      request.onupgradeneeded = (e: IDBVersionChangeEvent) => {
        const db: IDBDatabase = (e.target as any).result;
        if (this.onupgradeneeded) {
          this.onupgradeneeded(e, db);
        }
      };
      request.onsuccess = (e) => {
        const db = request.result;
        this.db = db;
        (async () => {
          if (this.onsuccess) {
            await this.onsuccess(db);
          }
        })().then(() => {
          res();
        })
      }
      request.onerror = (e) => {
        rej(e);
      }
    })
  }
  static async create(props: Props_MeeIndexedDB) {
    const indexdedClass = new MeeIndexedDB(props);
    await indexdedClass.setDB();
    return indexdedClass;
  }
  static async using({ callback, ...props }: Props_MeeIndexedDB_Using) {
    const indexdedClass = await MeeIndexedDB.create(props);
    if (indexdedClass.db) {
      await callback(indexdedClass, indexdedClass.db)
    }
    indexdedClass.close();
  }
  constructor({ dbName, version, forceDeleteDatabase, onupgradeneeded, onsuccess }: Props_MeeIndexedDB) {
    this.dbName = dbName;
    this.version = version;
    if (typeof forceDeleteDatabase === "boolean") this.forceDeleteDatabase = forceDeleteDatabase;
    this.onupgradeneeded = onupgradeneeded;
    this.onsuccess = onsuccess;
  }
}

export class MeeIndexedDBTable<T> implements Props_MeeIndexedDBTable<T> {
  db; options; tableName;
  props: Props_MeeIndexedDBTable_Constructor<T>;
  dbUpgradeneeded(db: IDBDatabase) {
    const objectStore = db.createObjectStore(this.tableName, { keyPath: this.options.primary?.toString() || "id" });
    this.options.secondary?.forEach((secondary) => {
      const name = secondary.toString();
      objectStore.createIndex(name, name, { unique: false });
    })
  }
  dbSuccess(db: IDBDatabase) {
    this.db = db;
  }
  constructor(props: Props_MeeIndexedDBTable_Constructor<T>) {
    this.props = props;
    this.db = props.db;
    this.options = props.options;
    this.tableName = props.tableName || props.options.key;
  }
  async clone() {
    return new MeeIndexedDBTable({ ...this.props, db: this.db });
  }
  async usingTransaction({ mode = "readonly", callback }: Props_MeeIndexedDB_UsingTransaction) {
    const transaction = this.db?.transaction(this.tableName, mode)
    if (transaction) {
      try {
        await callback(transaction);
        transaction.commit();
      } catch {
        transaction.abort();
      }
    }
  }
  getStore(transaction: IDBTransaction) {
    return transaction.objectStore(this.tableName);
  }
  async usingStore<C>({ callback, mode, store }: Props_MeeIndexedDB_UsingStore<C>) {
    let result: C | undefined;
    if (store) result = await callback(store);
    else {
      await this.usingTransaction({
        mode,
        callback: async (transaction) => {
          result = await callback(this.getStore(transaction));
        }
      })
    }
    return result;
  }
  static asyncRequest<R>(request: IDBRequest<R>) {
    return new Promise<R>((res, rej) => {
      request.onerror = () => {
        rej(e);
      };
      request.onsuccess = (e) => {
        res(request.result);
      };
    });
  }
  usingAsyncRequest<C>({ callback, ...props }: Props_MeeIndexedDB_UsingAsyncRequest<C>) {
    return this.usingStore({
      callback: (store) => {
        const request = callback(store);
        if (request) return MeeIndexedDB.asyncRequest(request);
      }, ...props
    });
  }
  private static storeIndex<T>(store: IDBObjectStore, index?: keyof T): IDBObjectStore | IDBIndex {
    if (index) return store.index(index.toString());
    else return store;
  }
  async get({ store, query, index }: Props_MeeIndexedDB_Request_Get<T>): Promise<T | undefined> {
    return this.usingAsyncRequest({
      store,
      callback(store) {
        return MeeIndexedDBTable.storeIndex(store, index).get(query);
      },
    });
  }
  async getAll({ store, query = null, count, index }: Props_MeeIndexedDB_Request_GetAll<T> = {}): Promise<T[]> {
    return await this.usingAsyncRequest({
      store,
      callback(store) {
        return MeeIndexedDBTable.storeIndex(store, index).getAll(query, count);
      },
    }) || [];
  }
  async find({ store, where, index, orderBy, query = null, direction, take, skip, callback }: Props_MeeIndexedDB_Find<T> = {}): Promise<T[]> {
    const enableSkip = typeof skip === "number";
    const surfaceWhereMap = new Map<string, findWhereType<T>>(Object.entries(where || {}));
    if (!direction && orderBy && index) {
      if ((index in orderBy[0])) {
        const value = orderBy.shift()!;
        const order: OrderByType = (value as any)[index];
        if (order === "desc") direction = "prev";
      }
    }
    return await this.usingStore({
      store,
      async callback(store) {
        const indexed = MeeIndexedDBTable.storeIndex(store, index);
        return await new Promise((res, rej) => {
          const values: T[] = [];
          const request = indexed.openCursor(query, direction);
          let i = 0;
          request.onsuccess = (e) => {
            const cursor = request.result;
            if (cursor) {
              const value: T = cursor.value;
              if (surfaceWhereMap.size === 0 || (findMeeWheresFilter(value, where) && (callback ? callback(value) : true))) {
                i++;
                if (enableSkip && skip >= i) {
                  cursor.continue();
                } else {
                  values.push(value);
                  if (take && values.length >= take) {
                    res(values);
                  } else cursor.continue();
                }
              } else cursor.continue();
            } else {
              res(values);
            }
          };
          request.onerror = (e) => { rej(e) }
        })
      },
    }).then((v) => {
      const list = v as T[];
      if (orderBy) findMeeSort({ orderBy, list })
      return list;
    }) || [];
  }
  async put({ value, store }: Props_MeeIndexedDB_Put) {
    return this.usingAsyncRequest({
      store,
      mode: "readwrite",
      callback(store) {
        return store.put(value);
      },
    });
  }
  async clear({ store }: Props_MeeIndexedDB_Request_Base = {}) {
    return this.usingAsyncRequest({
      store,
      mode: "readwrite",
      callback(store) {
        return store.clear();
      },
    });
  }
}


interface Props_MeeIndexedDB_UsingTransaction {
  mode?: IDBTransactionMode;
  callback(transaction: IDBTransaction): void | Promise<void>;
}

interface Props_MeeIndexedDB_UsingStore<C> {
  callback(store: IDBObjectStore): C | Promise<C>;
  store?: IDBObjectStore;
  mode?: IDBTransactionMode
}

interface Props_MeeIndexedDB_UsingAsyncRequest<C>
  extends Omit<Props_MeeIndexedDB_UsingStore<C>, "callback"> {
  callback(store: IDBObjectStore): IDBRequest<C> | undefined;
}

interface Props_MeeIndexedDB_Request_Base {
  store?: IDBObjectStore;
}

interface Props_MeeIndexedDB_Request_Get<T> extends Props_MeeIndexedDB_Request_Base {
  query: IDBValidKey | IDBKeyRange;
  index?: keyof T;
}

interface Props_MeeIndexedDB_Request_GetAll<T> extends Props_MeeIndexedDB_Request_Base {
  query?: IDBValidKey | IDBKeyRange | null;
  count?: number;
  index?: keyof T;
}

interface Props_MeeIndexedDB_Find<T>
  extends Props_MeeIndexedDB_Request_Base, findMeeProps<T> {
  callback?: (value: T) => boolean;
}

interface Props_MeeIndexedDB_Put extends Props_MeeIndexedDB_Request_Base {
  value: any;
}
