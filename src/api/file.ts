import { Hono } from "hono";
import { MeeSqlD1 } from "@/functions/database/MeeSqlD1";
import { IsLogin } from "@/admin";
import { DBTableClass, DBTableImport } from "./DBTableClass";
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
  const wheres: MeeSqlFindWhereType<FilesRecordDataType>[] = [];
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
      const { id, ...data } = item as KeyValueType<unknown>;
      const entry = TableObject.getInsertEntry(data);
      entry.lastmod = now.toISOString();
      now.setMilliseconds(now.getMilliseconds() + 1);
      const target = id
        ? (await TableObject.Select({ db, where: { id }, take: 1 }))[0]
        : undefined;
      if (target) {
        entry.key = data.key;
        if (entry.src && target.src && entry.src !== target.src) {
          const rename = String(entry.src);
          const object = await c.env.BUCKET.get(target.src);
          if (object) {
            await c.env.BUCKET.put(rename, await object.arrayBuffer());
            await c.env.BUCKET.delete(target.src);
          }
        }
        await TableObject.Update({ db, entry, take: 1, where: { id: id! } });
        return { type: "update", entry: { ...target, ...entry } };
      }
    })
  ).then(results => {
    return c.json(results);
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

app.delete("/send", async (c) => {
  const db = new MeeSqlD1(c.env.DB);
  const data = await c.req.json();
  const id = data.id;
  if (typeof data.id === "number") {
    const values = (await TableObject.Select({ db, params: "*", where: { id } }))[0];
    try {
      if (values.src) await c.env.BUCKET.delete(values.src);
      await TableObject.Update({
        db,
        entry: { ...TableObject.getFillNullEntry, lastmod: new Date().toISOString() },
        where: { id }
      });
      return c.text(id);
    } catch {
      return c.text("データベースでの削除に失敗しました", { status: 500 });
    }
  }
  return c.text("削除するデータがありません");
});

app.post("/import", async (c, next) => {
  return DBTableImport({
    db: new MeeSqlD1(c.env.DB),
    object: await c.req.json(),
    TableObject,
  })
    .then(() => c.text("インポートしました！"))
    .catch(() => c.text("インポートに失敗しました", 500));
})
app.delete("/all", async (c, next) => {
  if (import.meta.env?.DEV) {
    const db = new MeeSqlD1(c.env.DB);
    await TableObject.Drop({ db });
    return c.json({ message: "successed!" });
  }
  return next();
});

export const app_files_api = app;
