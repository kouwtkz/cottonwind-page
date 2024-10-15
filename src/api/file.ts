import { Hono } from "hono";
import { MeeSqlD1 } from "@/functions/database/MeeSqlD1";
import { IsLogin } from "@/admin";
import { lastModToUniqueNow } from "@/functions/doc/ToFunction";
import { PromiseOrder } from "@/functions/arrayFunction";
import { DBTableClass } from "./DBTableClass";
import { getBasename } from "@/functions/doc/PathParse";

export const app = new Hono<MeeBindings<MeeCommonEnv>>({
  strict: false,
});

const TableObject = new DBTableClass<FilesRecordDataType>({
  table: "files",
  createEntry: {
    id: { primary: true },
    key: { type: "TEXT", unique: true, notNull: true },
    src: { type: "TEXT" },
    private: { type: "INTEGER" },
    mtime: { type: "TEXT" },
    lastmod: { createAt: true, unique: true },
  },
  insertEntryKeys: ["key", "src", "private"],
  insertEntryTimes: ["mtime", "lastmod"]
});

app.use("*", async (c, next) => {
  if (IsLogin(c)) return next();
  else return c.text("403 Forbidden", 403)
});

export async function ServerFilesGetData(searchParams: URLSearchParams, db: MeeSqlD1, isLogin?: boolean) {
  const ThisObject = TableObject;
  const wheres: MeeSqlFindWhereType<SoundDataType>[] = [];
  const lastmod = searchParams.get("lastmod");
  if (lastmod) wheres.push({ lastmod: { gt: lastmod } });
  const key = searchParams.get("key");
  if (key) wheres.push({ key });
  const id = searchParams.get("id");
  if (id) wheres.push({ id: Number(id) });
  async function Select() {
    return ThisObject.Select({ db, where: { AND: wheres } })
      .then(data => isLogin ? data : data.map(v => v.private ? { ...v, ...ThisObject.getFillNullEntry, key: null } : v));
  }
  return Select().catch(() => ThisObject.CreateTable({ db }).then(() => Select()));
}

app.patch("/send", async (c, next) => {
  const db = new MeeSqlD1(c.env.DB);
  const rawData = await c.req.json();
  const data = Array.isArray(rawData) ? rawData : [rawData];
  const now = new Date();
  return Promise.all(
    data.map(async item => {
      const { id: _id, ...data } = item as KeyValueType<unknown>;
      const entry = TableObject.getInsertEntry(data);
      entry.lastmod = now.toISOString();
      now.setMilliseconds(now.getMilliseconds() + 1);
      const target_id = data.target ? String(data.target) : undefined;
      const target = target_id
        ? (await TableObject.Select({ db, where: { key: target_id }, take: 1 }))[0]
        : undefined;
      if (target) {
        entry.key = data.id;
        await TableObject.Update({ db, entry, take: 1, where: { key: target_id! } });
        return { type: "update", entry: { ...target, ...entry } };
      } else {
        entry.key = data.id || target_id;
        await TableObject.Insert({ db, entry });
        return { type: "create", entry }
      }
    })
  ).then(results => {
    return c.json(results, results.some(({ type }) => type === "create") ? 201 : 200);
  });
});

app.post("/send", async (c, next) => {
  const db = new MeeSqlD1(c.env.DB);
  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;
  if (file) {
    const src = "files/" + file.name;
    const key = getBasename(file.name);
    const time = new Date(file.lastModified);
    const mtime = time.toISOString();
    const entry = TableObject.getInsertEntry({
      src,
      mtime,
      lastmod: new Date().toISOString()
    });
    const selectValue = await TableObject.Select({ db, where: { key } })
    const value = selectValue[0];
    if (!value || value.mtime !== entry.mtime) {
      await c.env.BUCKET.put(src, file);
    }
    if (value) {
      await TableObject.Update({ db, entry, where: { key } });
    } else {
      entry.key = key;
      await TableObject.Insert({ db, entry });
    }
  }
  return c.text("");
});

app.post("/import", async (c, next) => {
  const db = new MeeSqlD1(c.env.DB);
  const object = await c.req.json() as importEntryDataType<KeyValueType<unknown>>;
  if (object.data) {
    if (object.overwrite) {
      await TableObject.Drop({ db });
      await TableObject.CreateTable({ db });
    }
    const list = object.data;
    if (Array.isArray(list)) {
      lastModToUniqueNow(list);
      for (const item of list) {
        if (item.key) await TableObject.Insert({ db, entry: TableObject.getInsertEntry(item) });
      }
      return c.text("インポートしました！")
    }
  }
  return c.text("インポートに失敗しました", 500);
})
app.delete("/all", async (c, next) => {
  if (c.env.DEV) {
    const db = new MeeSqlD1(c.env.DB);
    await TableObject.Drop({ db });
    return c.json({ message: "successed!" });
  }
  return next();
});

export const app_files_api = app;
