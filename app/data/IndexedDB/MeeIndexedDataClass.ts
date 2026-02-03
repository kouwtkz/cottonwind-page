import { SubscribeEventsClass } from "~/components/hook/SubscribeEvents";
import { MeeIndexedDBTable } from "./MeeIndexedDB";

export class IndexedDataClass<
  T,
  EVENT = void,
  TABLE_CLASS extends MeeIndexedDBTable<T> = MeeIndexedDBTable<T>
> extends SubscribeEventsClass<EVENT | Type_MeeIndexedDB_Event> {
  table: TABLE_CLASS;
  subscribe: EventCallback;
  isBusy: boolean;
  constructor(
    {
      defaultBusy = false,
      ...options
    }: Props_MeeIndexedDBTable_Options_WithArg<T>,
    tableOrDB?: TABLE_CLASS | IDBDatabase
  ) {
    let table: TABLE_CLASS;
    if (tableOrDB) {
      if ("transaction" in tableOrDB)
        table = new MeeIndexedDBTable(options, tableOrDB) as TABLE_CLASS;
      else table = tableOrDB;
    } else {
      table = new MeeIndexedDBTable(options) as TABLE_CLASS;
    }
    super();
    this.table = table;
    this.subscribe = this.getSubscribe("update");
    this.isBusy = defaultBusy;
  }
  async dbUpgradeneeded(e: IDBVersionChangeEvent, db: IDBDatabase) {
    return this.table.dbUpgradeneeded(e, db);
  }
  async dbSuccess(db: IDBDatabase) {
    this.table.dbSuccess(db);
    this.emitEvent("dbSet");
    this.emitEvent("update");
  }
  override emitSwitchEvents(name: EVENT, arg1: any): void {
    switch (name as EVENT | Type_MeeIndexedDB_Event) {
      case "dbSet":
        break;
      case "update":
        break;
    }
  }
  async updateData(): Promise<any> {
  }
  async save({ store, data, callback, onput, onerror, next, onsuccess }: Props_IndexedDataClass_Save<T>): Promise<any> {
    const thisTable = this.table;
    const emit = this.emitEvent.bind(this);
    if (data.length > 0) {
      this.isBusy = true;
      return thisTable.usingStore({
        async callback(store) {
          return Promise.all(data.map(async (value, i) => {
            if (callback) value = await callback(value, i);
            await thisTable.put({ value, store })
              .then((key) => {
                if (onput) onput({ key, value, index: i });
                emit("onput", key, value, i);
                return key;
              })
              .catch((e) => {
                if (onerror) onerror(e);
              })
              .finally(async () => {
                if (next) next(i);
                emit("loadingNext", i);
              })
          })).then<IDBValidKey[]>(a => a.filter(v => v) as any)
        }, store, mode: "readwrite"
      }).then(async v => {
        if (onsuccess) await onsuccess(v);
        return v;
      }).then((v) => {
        this.table.clone().then((table) => {
          this.table = table as TABLE_CLASS;
          emit("update");
        })
        return (v ? Promise.all(v) : [])
      })
        .finally(() => {
          this.isBusy = false;
        });
    } else return [];
  }
}

type IndexedKVClassType<V, K = string> = { key: K; value: V };

export class IndexedKVClass<V = string | null, K = string> extends IndexedDataClass<
  IndexedKVClassType<V, K>
> {
  constructor({
    name,
    ...props
  }: Omit<
    Props_MeeIndexedDBTable_Options_WithArg<V>,
    "primary" | "secondary"
  >) {
    super({ name, primary: "key", ...props });
  }
  save(props: Props_Indexed_KV_Save): Promise<Array<IndexedKVClassType<V, K>>>;
  save(props: Props_IndexedDataClass_Save): Promise<IndexedKVClassType<V, K>[]>;
  async save({ data, store }: Props_Indexed_KV_Save) {
    const items = ((
      (Array.isArray(data) ? data : Array.from(data.entries()))
    ) as Array<[K, V]>).map(([key, value]) => ({ key, value }));
    const result = await super.save({ store, data: items });
    await this.updateData();
    this.table = (await this.table.clone()) as MeeIndexedDBTable<IndexedKVClassType<V, K>>;
    this.emitEvent("update");
    return result;
  }
  async set(key: K, value: V, store?: IDBObjectStore) {
    return this.table.usingUpdate({
      store,
      query: key as IDBValidKey,
      callback: (base) => {
        if (base) {
          return { ...base, value };
        } else {
          return { key, value };
        }
      },
    });
  }
  async getAllMap() {
    return this.table.getAll().then((items) => {
      const map = new Map<K, V>();
      items.forEach(item => {
        map.set(item.key, item.value);
      });
      return map;
    })
  }
  async get(query: Props_MeeIndexedDB_Query | K) {
    return this.table.get(query as any).then(v => v?.value);
  }
  async delete(query: Props_MeeIndexedDB_Query | K) {
    return this.table.delete(query as any);
  }
}
