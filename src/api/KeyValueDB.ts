import { Hono, HonoRequest } from "hono";
import { IsLogin } from "@/admin";
import { MeeSqlD1 } from "@/functions/database/MeeSqlD1";
import { DBTableClass, DBTableImport } from "./DBTableClass";
import { KeyValueDBDataOptions, likeDataOptions } from "@/Env";
import { UpdateTablesDataObject } from "./DBTablesObject";
import { GetDataProps } from "./propsDef";

export const app = new Hono<MeeBindings>();

app.use("*", async (c, next) => {
  if (
    IsLogin(c)
    || (c.req.method === "POST" && c.req.path.endsWith("/send"))
  ) return next();
  else return c.text("403 Forbidden", 403);
});

const TableObject = new DBTableClass<KeyValueDBType>({
  table: KeyValueDBDataOptions.key,
  createEntry: {
    key: { primary: true, type: "TEXT" },
    value: { type: "TEXT" },
    lastmod: { createAt: true, unique: true },
  },
  insertEntryKeys: ["key", "value"],
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
  }
  return Select().catch(() => TableObject.CreateTable({ db })
    .then(() => UpdateTablesDataObject({ db, options: KeyValueDBDataOptions }))
    .then(() => Select()));
}

app.post("/send", async (c, next) => {
  const db = new MeeSqlD1(c.env.DB);
  const now = new Date();
  let { key, update, ...data } = await c.req.json() as KeyValueSendType;
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
  const data = await c.req.json();
  const postId = String(data.postId || "");
  if (postId) {
    const db = new MeeSqlD1(c.env.DB);
    try {
      await TableObject.Update({
        db,
        entry: { ...TableObject.getFillNullEntry, lastmod: new Date().toISOString() },
        where: { postId }
      });
      return c.text(postId);
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
    object: await c.req.json(),
    TableObject,
    idKey: "key",
    kvConvertEntry: true,
  })
    .then(() => c.text("インポートしました！"))
    .catch(() => c.text("インポートに失敗しました", 500));
});

app.delete("/all", async (c, next) => {
  if (import.meta.env?.DEV) {
    const db = new MeeSqlD1(c.env.DB);
    await TableObject.Drop({ db });
    return c.json({ message: "successed!" });
  }
  return next();
});

export const app_kvdb_api = app;
