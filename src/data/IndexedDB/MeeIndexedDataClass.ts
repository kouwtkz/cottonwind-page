import { EventCallback, SubscribeEventsClass } from "@/components/hook/SubscribeEvents";
import { MeeIndexedDBTable } from "./MeeIndexedDB";

export class IndexedDataClass<
  T,
  EVENT = void,
  TABLE_CLASS extends MeeIndexedDBTable<T> = MeeIndexedDBTable<T>,
> extends SubscribeEventsClass<EVENT | Type_MeeIndexedDB_Event> {
  table: TABLE_CLASS;
  subscribe: EventCallback;
  isBusy: boolean;
  constructor({ defaultBusy = false, ...options }: Props_MeeIndexedDBTable_Options_WithArg<T>, tableOrDB?: TABLE_CLASS | IDBDatabase) {
    let table: TABLE_CLASS;
    if (tableOrDB) {
      if ("transaction" in tableOrDB) table = (new MeeIndexedDBTable(options, tableOrDB) as TABLE_CLASS);
      else table = tableOrDB;
    } else {
      table = (new MeeIndexedDBTable(options) as TABLE_CLASS);
    }
    super();
    this.table = table;
    this.subscribe = this.getSubscribe("update");
    this.isBusy = defaultBusy;
  }
  override emitSwitchEvents(name: EVENT, arg1: any): void {
    switch (name) {
      case "update":
        this.updateData();
        break;
    }
  }
  async updateData() { }
  async save({ store, data, callback }: Props_IndexedDataClass_Save<T>) {
    this.isBusy = true;
    return this.table.usingStore(
      {
        store,
        mode: "readwrite",
        async callback(store) {
          return data.map<Promise<T>>(async (item: any) => {
            if (callback) item = await callback(item);
            store.put(item);
            return item;
          });
        },
      }
    );
  }
}
