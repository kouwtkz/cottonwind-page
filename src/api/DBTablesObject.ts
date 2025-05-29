import { MeeSqlD1 } from "@src/data/functions/MeeSqlD1";
import { DBTableClass } from "./DBTableClass";
import { TableVersionDataOptions } from "@src/data/DataEnv";
import { GetDataProps } from "./propsDef";

export const TableObject = new DBTableClass<Props_LastmodMH_Tables_Data>({
  table: "tables",
  createEntry: {
    key: { primary: true, type: "TEXT" },
    version: { type: "TEXT" },
    lastmod: { createAt: true, unique: true },
  },
  insertEntryKeys: ["key", "version"],
  insertEntryTimes: ["lastmod"],
});
interface UpdateTablesDataObjectProps {
  db: MeeSqlD1;
  options: Props_LastmodMH_TableVersion;
  lastmod?: string;
  viewSql?: boolean;
}
export async function UpdateTablesDataObject({
  db,
  options,
  lastmod = new Date().toISOString(),
  ...args
}: UpdateTablesDataObjectProps) {
  const value = (
    await TableObject.Select({ db, where: { key: options.name }, ...args })
  )[0];
  if (!value) {
    await TableObject.Insert({
      db,
      entry: { key: options.name, version: options.version },
      ...args,
    });
  } else if (value.version !== options.version) {
    await TableObject.Update({
      db,
      where: {
        key: options.name,
      },
      entry: {
        version: options.version,
        lastmod,
      },
      ...args,
    });
  }
}

export async function ServerTableVersionGetData({ searchParams, db }: GetDataProps) {
  const ThisObject = TableObject;
  const wheres: MeeSqlFindWhereType<FilesRecordDataType>[] = [];
  const lastmod = searchParams.get("lastmod");
  if (lastmod) wheres.push({ lastmod: { gt: lastmod } });
  const key = searchParams.get("key");
  if (key) wheres.push({ key });
  const id = searchParams.get("id");
  if (id) wheres.push({ id: Number(id) });
  async function Select() {
    return ThisObject.Select({ db, where: { AND: wheres } })
  }
  return Select().catch(() => TableObject.CreateTable({ db })
    .then(() => UpdateTablesDataObject({ db, options: TableVersionDataOptions }))
    .then(() => Select()));
}

export const TablesDataObject = TableObject;
