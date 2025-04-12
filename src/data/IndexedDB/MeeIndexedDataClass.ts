import { SubscribeEventsClass } from "@/components/hook/SubscribeEvents";
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
    this.emit("update");
  }
  override emitSwitchEvents(name: EVENT, arg1: any): void {
    switch (name) {
      case "update":
        this.updateData();
        break;
    }
  }
  async updateData() {
  }
  async save({ store, data, callback }: Props_IndexedDataClass_Save<T>) {
    if (data.length > 0) {
      this.isBusy = true;
      const primary = this.table.options.primary as keyof T;
      return await Promise.all(
        data.map(async (value) => {
          return this.table.usingUpdate({
            store,
            query: value[primary] as any,
            callback: async (callbackItem) => {
              let item = callbackItem ? { ...callbackItem, ...value } : value;
              if (callback) item = await callback(item);
              return item;
            },
          });
        })
      ).then((v) => {
        this.table.clone().then((table) => {
          this.table = table as TABLE_CLASS;
          this.emit("update");
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
    this.table = (await this.table.clone()) as MeeIndexedDBTable<IndexedKVClassType<V, K>>;
    this.emit("update");
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
