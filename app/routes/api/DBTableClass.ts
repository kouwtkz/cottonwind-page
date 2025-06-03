import { KeyValueConvertDBEntry } from "~/components/functions/doc/ToFunction";
import { MeeSqlClass } from "~/data/functions/MeeSqlClass";
import { MeeSqlD1 } from "~/data/functions/MeeSqlD1";

export class DBTableClass<T extends Object = any> {
  table: string;
  createEntry: MeeSqlCreateTableEntryType<T>;
  errorEnable?: boolean;
  insertEntryKeys?: (keyof T)[];
  insertEntryTimes?: (keyof T)[];
  constructor({
    table,
    createEntry,
    insertEntryKeys,
    insertEntryTimes,
  }: DBTableClassProps<T>) {
    this.table = table;
    this.createEntry = createEntry;
    this.insertEntryKeys = insertEntryKeys;
    this.insertEntryTimes = insertEntryTimes;
  }
  async CreateTable<D extends MeeSqlClass<any>>({ db }: { db: D }) {
    await db
      .createTable({
        table: this.table,
        entry: this.createEntry,
      })
      .catch((e) => {
        if (this.errorEnable) console.error(e);
      });
  }
  async Select<D extends MeeSqlClass<any>>({
    db,
    ...args
  }: Omit<MeeSqlSelectProps<T>, "table"> & { db: D }) {
    const _s = () => {
      return db.select<T>({ table: this.table, ...args });
    };
    return _s().catch(() => this.CreateTable({ db }).then(() => _s()));
  }
  async Update<D extends MeeSqlClass<any>>({
    db,
    ...args
  }: Omit<MeeSqlUpdateProps<T>, "table"> & { db: D }) {
    return db.update<T>({ table: this.table, ...args });
  }
  async Insert<D extends MeeSqlClass<any>>({
    db,
    ...args
  }: Omit<MeeSqlInsertProps<T>, "table"> & { db: D }) {
    return db.insert<T>({ table: this.table, ...args });
  }
  async Drop<D extends MeeSqlClass<any>>({
    db,
    viewSql,
  }: Omit<MeeSqlBaseProps, "table"> & { db: D }) {
    return db.dropTable({ table: this.table, viewSql }).catch(() => { });
  }
  async Rename<D extends MeeSqlClass<any>>({ db, from, table, viewSql }: Omit<MeeSqlBaseProps, "table"> & { db: D, from?: string, table: string }) {
    return db.renameTable({ from: from ?? this.table, table, viewSql }).catch(() => { });
  }
  getInsertEntry(
    data: { [k in keyof T]?: any },
    options?: getInsertEntryOptionsProps<T>
  ): MeeSqlEntryType<T> {
    const {
      keys = this.insertEntryKeys,
      times = this.insertEntryTimes,
      enableKVConvert = true,
    } = options || {};
    if (enableKVConvert) KeyValueConvertDBEntry(data as KeyValueType);
    const entries = (keys || [])
      .map((k) => [k, data[k]])
      .filter(([k, v]) => v !== undefined);
    if (times)
      times.forEach((k) => {
        if (data[k]) entries.push([k, new Date(String(data[k])).toISOString()]);
      });
    return Object.fromEntries(entries);
  }
  async getTimeFieldLatest<D extends MeeSqlClass<any>>({
    db,
    field = "lastmod",
    value,
    ...args
  }: getTimeFieldLatestProps<T, D>) {
    const time = new Date(value);
    const since = time.toISOString();
    time.setSeconds(time.getSeconds() + 1);
    const until = time.toISOString();
    return (
      await this.Select({
        db,
        where: {
          AND: [{ [field]: { gte: since } }, { [field]: { lt: until } }] as any,
        },
        take: 1,
        orderBy: { [field]: "desc" } as any,
        ...args,
      })
    )[0] as T | undefined;
  }
  async getTimeFieldLatestAddTime<D extends MeeSqlClass<any>>({
    field = "lastmod",
    value,
    ...args
  }: getTimeFieldLatestProps<T, D>) {
    const latest: any = await this.getTimeFieldLatest({
      field,
      value,
      ...args,
    });
    if (latest && latest[field]) {
      const latestLastmod = new Date(latest[field]);
      latestLastmod.setMilliseconds(latestLastmod.getMilliseconds() + 1);
      return latestLastmod.toISOString();
    } else return value;
  }
  async getClassifyScheduleValue<D extends MeeSqlClass<any>>({
    now = new Date().toISOString(),
    value,
    time,
    existTime,
    field = "lastmod",
    ...args
  }: classifyScheduleEntryProps<T, D>) {
    if (time) {
      if (time > now) value = time;
      else value = now;
    } else if (existTime) {
      if (existTime <= now) value = now;
    } else value = now;
    if (typeof value === "string") {
      return await this.getTimeFieldLatestAddTime({ ...args, value, field });
    } else return;
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

export interface DBTableClassTemplateProps<T>
  extends Omit<DBTableClassProps<T>, "table"> { }

interface getInsertEntryOptionsProps<T> {
  keys?: (keyof T)[];
  times?: (keyof T)[];
  enableKVConvert?: boolean;
}

interface getTimeFieldLatestProps<T, D>
  extends Omit<MeeSqlSelectProps<T>, "table" | "take" | "where" | "orderBy"> {
  db: D;
  field?: string;
  value: string;
}

interface classifyScheduleEntryProps<T, D>
  extends Omit<getTimeFieldLatestProps<T, D>, "value"> {
  now?: string;
  value?: unknown;
  time?: string | null;
  existTime?: string | null;
}

interface DBTableImportProps<T extends Object> {
  db: MeeSqlD1;
  object: importEntryDataType<KeyValueType<unknown>>;
  TableObject: DBTableClass<T>;
  kvConvertEntry?: boolean;
  idKey?: keyof T;
  lastmodKey?: string;
}
export async function DBTableImport<T extends Object>({
  db,
  object,
  TableObject,
  kvConvertEntry,
  idKey: _idKey,
  lastmodKey: lastmod = "lastmod",
}: DBTableImportProps<T>) {
  const idKey = _idKey || "key";
  if (object.data) {
    if (object.overwrite && object.first) {
      await TableObject.Drop({ db });
      await TableObject.CreateTable({ db });
    }
    const list = object.data as any[];
    const now = new Date();
    if (Array.isArray(list)) {
      if (kvConvertEntry) KeyValueConvertDBEntry(list);
      for (const item of list) {
        const key = item[idKey];
        if (key) {
          let has = false;
          let update = false;
          if (!object.overwrite) {
            const value = (
              await TableObject.Select({ db, where: { [idKey]: key }, take: 1 })
            )[0] as unknown as KeyValueType<unknown> | undefined;
            if (value) {
              has = Boolean(value);
              update = (value.lastmod || "") < (item.lastmod || "");
            }
          }
          if (has) {
            if (update)
              await TableObject.Update({
                db,
                where: { [idKey]: key },
                entry: TableObject.getInsertEntry(item),
              });
          } else {
            item[lastmod] = now.toISOString();
            await TableObject.Insert({
              db,
              entry: TableObject.getInsertEntry(item),
            });
          }
        }
        now.setMilliseconds(now.getMilliseconds() + 1);
      }
    }
  }
}
