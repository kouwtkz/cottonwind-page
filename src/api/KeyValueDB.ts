import { Hono, HonoRequest } from "hono";
import { IsLogin } from "@src/admin";
import { MeeSqlD1 } from "@src/data/functions/MeeSqlD1";
import { DBTableClass, DBTableImport } from "./DBTableClass";
import { KeyValueDBDataOptions, likeDataOptions } from "@src/data/DataEnv";
import { UpdateTablesDataObject } from "./DBTablesObject";
import { GetDataProps } from "./propsDef";

export const app = new Hono<MeeBindings>();

app.use("*", async (c, next) => {
  if (
    IsLogin(c)
    || (request.method === "POST" && request.path.endsWith("/send"))
  ) return next();
  else return c.text("403 Forbidden", 403);
});

const TableObject = new DBTableClass<KeyValueDBType>({
  table: KeyValueDBDataOptions.name,
  createEntry: {
    key: { primary: true, type: "TEXT" },
    value: { type: "TEXT" },
    private: { type: "NUMERIC" },
    lastmod: { createAt: true, unique: true },
  },
  insertEntryKeys: ["key", "value", "private"],
  insertEntryTimes: ["lastmod"]
});

export async function ServerKeyValueDBGetData({ searchParams, db, isLogin, req }: GetDataProps) {
  const ThisObject = TableObject;
  const wheres: MeeSqlFindWhereType<KeyValueDBType>[] = [];
  const lastmod = searchParams.get("lastmod");
  if (lastmod) wheres.push({ lastmod: { gt: lastmod } });
  const key = searchParams.get("key");
  if (key) wheres.push({ key });
  async function Select() {
    return ThisObject.Select({ db, where: { AND: wheres } })
      .then(data => isLogin ? data : data.map(v => v.private ? { ...v, ...TableObject.getFillNullEntry, private: v.private } : v))
  }
  return Select().catch(() => TableObject.CreateTable({ db })
    .then(() => UpdateTablesDataObject({ db, options: KeyValueDBDataOptions }))
    .then(() => Select()));
}

app.post("/send", async (c, next) => {
  const db = getCfDB({ context });;
  const now = new Date();
  let { key, update, ...data } = await request.json() as KeyValueSendType;
  if (key) {
    const entry = TableObject.getInsertEntry(data);
    const whereKey = update || key;
    const target = (await TableObject.Select({ db, where: { key: whereKey }, take: 1 }))[0];
    entry.lastmod = now.toISOString();
    entry.lastmod = await TableObject.getClassifyScheduleValue({
      db,
    });
    if (target) {
      if (update) entry.key = key;
      await TableObject.Update({ db, entry, where: { key: whereKey } });
      return c.json({ ...target, ...entry, }, 200);
    } else {
      entry.key = key;
      await TableObject.Insert({ db, entry });
      return c.json(entry, 201);
    }
  } else {
    return c.json({ message: "keyが設定されていません" }, 202);
  }
});

app.delete("/send", async (c) => {
  const data = await request.json();
  const key = String(data.key || "");
  if (key) {
    const db = getCfDB({ context });;
    try {
      await TableObject.Update({
        db,
        entry: { ...TableObject.getFillNullEntry, lastmod: new Date().toISOString() },
        where: { key }
      });
      return c.text(key);
    } catch {
      return c.text("データベースでの削除に失敗しました", { status: 500 });
    }
  } else {
    return c.text("ID未指定です", { status: 500 });
  }
});

app.post("/import", async (c) => {
  return DBTableImport({
    db: new MeeSqlD1(c.env.DB),
    object: await request.json(),
    TableObject,
    idKey: "key",
    kvConvertEntry: true,
  })
    .then(() => c.text("インポートしました！"))
    .catch(() => c.text("インポートに失敗しました", 500));
});

app.delete("/all", async (c, next) => {
  if (import.meta.env?.DEV) {
    const db = getCfDB({ context });;
    await TableObject.Drop({ db });
    return c.json({ message: "successed!" });
  }
  return next();
});

export const app_kvdb_api = app;
