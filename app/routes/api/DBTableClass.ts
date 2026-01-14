import { KeyValueConvertDBEntry } from "~/components/functions/doc/ToFunction";
import { MeeSqlClass } from "~/data/functions/MeeSqlClass";
import { MeeSqlD1 } from "~/data/functions/MeeSqlD1";

export class DBTableClass<T extends Object = any, D extends Object = T> {
  table: string;
  createEntry?: MeeSqlCreateTableEntryType<D>;
  errorEnable?: boolean;
  options?: Props_LastmodMHClass_Options<T, D>;
  insertEntryKeys?: (keyof D)[];
  insertEntryTimes?: (keyof D)[];
  constructor(props: Props_LastmodMHClass_Options<T, D>) {
    this.table = props.name;
    this.options = props;
    this.createEntry = props.createEntry;
    this.insertEntryKeys = props.insertEntryKeys;
    this.insertEntryTimes = props.insertEntryTimes;
  }
  async CreateTable<D extends MeeSqlClass<any>>({ db }: { db: D }) {
    if (this.createEntry)
      await db
        .createTable({
          table: this.table,
          entry: this.createEntry,
        })
        .catch((e) => {
          if (this.errorEnable) console.error(e);
        });
  }
  async Select<S extends MeeSqlClass<any>>({
    db,
    ...args
  }: Omit<MeeSqlSelectProps<D>, "table"> & { db: S }) {
    const _s = () => {
      return db.select({ table: this.table, ...args }) || [];
    };
    return _s().catch(() => this.CreateTable({ db }).then(() => _s()));
  }
  async Update<S extends MeeSqlClass<any>>({
    db,
    ...args
  }: Omit<MeeSqlUpdateProps<D>, "table"> & { db: S }) {
    return db.update<D>({ table: this.table, ...args });
  }
  async Insert<S extends MeeSqlClass<any>>({
    db,
    ...args
  }: Omit<MeeSqlInsertProps<D>, "table"> & { db: S }) {
    return db.insert({ table: this.table, ...args });
  }
  async Drop<S extends MeeSqlClass<any>>({
    db,
    viewSql,
  }: Omit<MeeSqlBaseProps, "table"> & { db: S }) {
    return db.dropTable({ table: this.table, viewSql }).catch(() => { });
  }
  async Rename<D extends MeeSqlClass<any>>({ db, from, table, viewSql }: Omit<MeeSqlBaseProps, "table"> & { db: D, from?: string, table: string }) {
    return db.renameTable({ from: from ?? this.table, table, viewSql }).catch(() => { });
  }
  getInsertEntry(
    data: { [k in keyof D]?: any },
    options?: getInsertEntryOptionsProps<D>
  ): MeeSqlEntryType<D> {
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
  async getTimeFieldLatest<S extends MeeSqlClass = MeeSqlClass<any>>({
    db,
    field = "lastmod",
    value,
    ...args
  }: getTimeFieldLatestProps<D, S>) {
    const time = new Date(value);
    const since = time.toISOString();
    time.setSeconds(time.getSeconds() + 1);
    const until = time.toISOString();
    return (
      await this.Select<S>({
        db,
        where: {
          AND: [{ [field]: { gte: since } }, { [field]: { lt: until } }] as any,
        },
        take: 1,
        orderBy: { [field]: "desc" } as any,
        ...args,
      })
    )[0];
  }
  async getTimeFieldLatestAddTime({
    field = "lastmod",
    value,
    ...args
  }: getTimeFieldLatestProps<D>) {
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
  async getClassifyScheduleValue({
    now = new Date().toISOString(),
    value,
    time,
    existTime,
    field = "lastmod",
    ...args
  }: classifyScheduleEntryProps<D>) {
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
    return this.createEntry ? MeeSqlClass.fillNullEntry(this.createEntry) : {};
  }
}

export interface DBTableClassProps<T, D> {
  table?: string;
  options: Props_LastmodMHClass_Options<T, D>;
}

export interface DBTableClassTemplateProps<T, D = T>
  extends Omit<DBTableClassProps<T, D>, "table"> { }

interface getInsertEntryOptionsProps<T> {
  keys?: (keyof T)[];
  times?: (keyof T)[];
  enableKVConvert?: boolean;
}

interface getTimeFieldLatestProps<D extends Object, S extends MeeSqlClass = MeeSqlClass<any>>
  extends Omit<MeeSqlSelectProps<D>, "table" | "take" | "where" | "orderBy"> {
  db: S;
  field?: string;
  value: string;
}

interface classifyScheduleEntryProps<D extends Object, S extends MeeSqlClass = MeeSqlClass<any>>
  extends Omit<getTimeFieldLatestProps<D, S>, "value"> {
  now?: string;
  value?: unknown;
  time?: string | null;
  existTime?: string | null;
}

interface DBTableImportProps<T extends Object, D extends Object = T> {
  db: MeeSqlD1;
  object: importEntryDataType<KeyValueType<unknown>>;
  TableObject: DBTableClass<T, D>;
  kvConvertEntry?: boolean;
  idKey?: keyof D;
  lastmodKey?: string;
}
export async function DBTableImport<T extends Object, D extends Object = T>({
  db,
  object,
  TableObject,
  kvConvertEntry,
  idKey: _idKey,
  lastmodKey: lastmod = "lastmod",
}: DBTableImportProps<T, D>) {
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
