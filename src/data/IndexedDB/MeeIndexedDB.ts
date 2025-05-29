import { findMeeSort, findMeeWheresFilter } from "@src/functions/find/findMee";

export class MeeIndexedDB implements Props_MeeIndexedDB {
  db?: IDBDatabase;
  dbName: string;
  version?: number;
  forceDeleteDatabase?: boolean;
  onupgradeneeded?: onupgradeneededFunction;
  onsuccess?: onsuccessFunction;
  static asyncRequest<R>(request: IDBRequest<R>) {
    return new Promise<R>((res, rej) => {
      request.onerror = (e) => {
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

export class MeeIndexedDBTable<T> {
  db?: IDBDatabase;
  options: Props_MeeIndexedDBTable_Options_Defined<T>;
  constructor({ primary = "id", ...options }: Props_MeeIndexedDBTable_Options<T>, db?: IDBDatabase) {
    this.db = db;
    this.options = { primary, ...options };
  }
  async dbUpgradeneeded(e: IDBVersionChangeEvent, db: IDBDatabase) {
    let store: IDBObjectStore;
    if (e.oldVersion) {
      const request = e.target as IDBOpenDBRequest;
      store = this.getStore(request.transaction!);
    } else {
      store = db.createObjectStore(this.options.name, { keyPath: this.options.primary.toString() });
    }
    const secondary = (this.options.secondary || []) as Array<string>;
    const added = secondary.filter(name => !store.indexNames.contains(name));
    const removed = Array.from(store.indexNames).filter((name) => secondary.every((sn) => sn !== name));
    added.forEach((name) => {
      store.createIndex(name, name, { unique: false });
    })
    removed.forEach(name => {
      store.deleteIndex(name);
    })
  }
  dbSuccess(db: IDBDatabase) {
    this.db = db;
  }
  async clone() {
    return new MeeIndexedDBTable(this.options, this.db);
  }
  async usingTransaction({ mode = "readonly", callback }: Props_MeeIndexedDB_UsingTransaction) {
    const transaction = this.db?.transaction(this.options.name, mode)
    if (transaction) {
      try {
        await callback(transaction);
        transaction.commit();
      } catch (e) {
        console.error(e);
        transaction.abort();
      }
    }
  }
  getStore(transaction: IDBTransaction) {
    return transaction.objectStore(this.options.name);
  }
  async usingStore<C, R = C | undefined>({ callback, mode, store, transaction }: Props_MeeIndexedDB_UsingStore<C>) {
    let result: any;
    if (store) result = await callback(store);
    else if (transaction) result = await callback(this.getStore(transaction));
    else {
      await this.usingTransaction({
        mode,
        callback: async (transaction) => {
          result = await callback(this.getStore(transaction));
        }
      })
    }
    return result as R;
  }
  static asyncRequest<R>(request: IDBRequest<R>) {
    return new Promise<R>((res, rej) => {
      request.onerror = (e) => {
        rej(e);
      };
      request.onsuccess = (e) => {
        res(request.result);
      };
    });
  }
  usingAsyncRequest<C = T>({ callback, ...props }: Props_MeeIndexedDB_UsingAsyncRequest<C>) {
    return this.usingStore({
      callback: (store) => {
        const request = callback(store);
        if (request) return MeeIndexedDB.asyncRequest(request);
      }, ...props
    });
  }
  async usingCursor<C = T>({ query, index, direction, callback, ...props }: Props_MeeIndexedDB_UsingCursor<C>) {
    return await this.usingStore({
      ...props,
      async callback(store) {
        return await new Promise<C | Promise<C>>((res, rej) => {
          const request = MeeIndexedDBTable.storeIndex(store, index).openCursor(query, direction);
          request.onsuccess = async () => {
            res(await callback(request.result));
          }
          request.onerror = (e) => {
            rej(e);
          }
        })
      },
    });
  }
  async usingUpdate<C = T>({ callback, store, transaction, index, query, direction }: Props_MeeIndexedDB_UsingUpdate<C>) {
    const mode: IDBTransactionMode = "readwrite";
    return await this.usingStore({
      store, mode, transaction,
      callback: async (store) => {
        const indexed = MeeIndexedDBTable.storeIndex(store, index);
        return await new Promise<void>((res, rej) => {
          const request = indexed.openCursor(query, direction);
          request.onsuccess = async (e) => {
            const cursor = request.result;
            if (cursor) {
              let value: C | null = cursor.value;
              if (callback) {
                value = await callback(value) || null;
              }
              if (value) cursor.update(value);
              cursor.continue();
            } else {
              res();
            }
          };
          request.onerror = (e) => { rej(e) }
        });
      },
    })
  }
  private static storeIndex<T>(store: IDBObjectStore, index?: keyof T): IDBObjectStore | IDBIndex {
    if (index) return store.index(index.toString());
    else return store;
  }
  async get(props: Props_MeeIndexedDB_Key<T> | string): Promise<T | undefined> {
    const { store, query, index } = typeof props === "string" ? { query: props } : props;
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
  async getAllMap<K = IDBValidKey>(props: Props_MeeIndexedDB_Request_GetAll<T> = {}) {
    return this.getAll(props).then((items) => {
      const key = (props.index || this.options.primary) as keyof T;
      const map = new Map<K, T>();
      items.forEach(item => {
        map.set(item[key] as K, item);
      });
      return map;
    })
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
  async put({ value, store }: Props_MeeIndexedDB_Value) {
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
  async delete({ store, query }: Props_MeeIndexedDB_Query) {
    return this.usingAsyncRequest({
      store,
      mode: "readwrite",
      callback(store) {
        return store.delete(query);
      },
    });
  }
}

interface Props_MeeIndexedDB_UsingTransaction {
  mode?: IDBTransactionMode;
  callback(transaction: IDBTransaction): void | Promise<void>;
}
interface Props_MeeIndexedDB_UsingStore<C> extends Props_MeeIndexedDB_Request_Base {
  mode?: IDBTransactionMode
  callback(store: IDBObjectStore): C | Promise<C>;
}

interface Props_MeeIndexedDB_UsingCursor<T> extends Props_MeeIndexedDB_Key<T>, Props_MeeIndexedDB_Request_Base {
  direction?: IDBCursorDirection;
  mode?: IDBTransactionMode
  callback(cursor: IDBCursorWithValue | null): T | Promise<T>;
}

interface Props_MeeIndexedDB_UsingUpdate<T> extends Omit<Props_MeeIndexedDB_UsingCursor<T>, "callback" | "mode" | "query"> {
  callback?(value: T | null): T | Promise<T> | void;
  query?: IDBValidKey | IDBKeyRange;
}

interface Props_MeeIndexedDB_UsingAsyncRequest<C>
  extends Omit<Props_MeeIndexedDB_UsingStore<C>, "callback"> {
  callback(store: IDBObjectStore): IDBRequest<C> | undefined;
}
