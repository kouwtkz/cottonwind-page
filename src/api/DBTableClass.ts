import { KeyValueConvertDBEntry } from "@/functions/doc/ToFunction";
import { MeeSqlClass } from "@/functions/database/MeeSqlClass";

export class DBTableClass<T extends Object = any> {
  table: string;
  createEntry: MeeSqlCreateTableEntryType<T>;
  errorEnable?: boolean;
  insertEntryKeys?: (keyof T)[];
  insertEntryTimes?: (keyof T)[];
  constructor({ table, createEntry, insertEntryKeys, insertEntryTimes }: DBTableClassProps<T>) {
    this.table = table;
    this.createEntry = createEntry;
    this.insertEntryKeys = insertEntryKeys;
    this.insertEntryTimes = insertEntryTimes;
  }
  async CreateTable<D extends MeeSqlClass<unknown>>({ db }: { db: D }) {
    await db
      .createTable({
        table: this.table,
        entry: this.createEntry,
      })
      .catch((e) => { if (this.errorEnable) console.error(e); });
  }
  async Select<D extends MeeSqlClass<unknown>>({ db, ...args }: Omit<MeeSqlSelectProps<T>, "table"> & { db: D }) {
    const _s = () => {
      return db.select<T>({ table: this.table, ...args });
    }
    return _s().catch(() => this.CreateTable({ db }).then(() => _s()))
  }
  async Update<D extends MeeSqlClass<unknown>>({ db, ...args }: Omit<MeeSqlUpdateProps<T>, "table"> & { db: D }) {
    return db.update<T>({ table: this.table, ...args });
  }
  async Insert<D extends MeeSqlClass<unknown>>({ db, ...args }: Omit<MeeSqlInsertProps<T>, "table"> & { db: D }) {
    return db.insert<T>({ table: this.table, ...args });
  }
  async Drop<D extends MeeSqlClass<unknown>>({ db, viewSql }: Omit<MeeSqlBaseProps, "table"> & { db: D }) {
    return db.dropTable({ table: this.table, viewSql }).catch(() => { });
  }
  getInsertEntry(data: { [k in keyof T]?: any }, options?: getInsertEntryOptionsProps<T>): MeeSqlEntryType<T> {
    const { keys = this.insertEntryKeys, times = this.insertEntryTimes, enableKVConvert = true } = options || {};
    if (enableKVConvert) KeyValueConvertDBEntry(data as KeyValueType);
    const entries = (keys || []).map(k => [k, data[k]]).filter(([k, v]) => v !== undefined);
    if (times) times.forEach(k => {
      if (data[k]) entries.push([k, new Date(String(data[k])).toISOString()]);
    })
    return Object.fromEntries(entries);
  }
  get getFillNullEntry() {
    return MeeSqlClass.fillNullEntry(this.createEntry);
  }
}

export interface DBTableClassProps<T> {
  table: string;
  createEntry: MeeSqlCreateTableEntryType<T>;
  insertEntryKeys?: (keyof T)[];
  insertEntryTimes?: (keyof T)[];
}

export interface DBTableClassTemplateProps<T> extends Omit<DBTableClassProps<T>, "table"> { }

interface getInsertEntryOptionsProps<T> {
  keys?: (keyof T)[];
  times?: (keyof T)[];
  enableKVConvert?: boolean;
}