import { MeeSqlD1 } from "@/functions/database/MeeSqlD1";
import { DBTableClass } from "./DBTableClass";

export const TablesObject = new DBTableClass<TableVersionEntryType>({
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
  options: TableVersionProps;
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
    await TablesObject.Select({ db, where: { key: options.key }, ...args })
  )[0];
  if (!value) {
    await TablesObject.Insert({
      db,
      entry: { key: options.key, version: options.version },
      ...args,
    });
  } else if (value.version !== options.version) {
    await TablesObject.Update({
      db,
      where: {
        key: options.key,
      },
      entry: {
        version: options.version,
        lastmod,
      },
      ...args,
    });
  }
}

export const TablesDataObject = TablesObject;
