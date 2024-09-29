import { Hono } from "hono";
import { MeeSqlD1 } from "@/functions/database/MeeSqlD1";
import { IsLogin } from "@/admin";
import { lastModToUniqueNow } from "@/functions/doc/ToFunction";
import { PromiseOrder } from "@/functions/arrayFunction";
import { DBTableClass } from "./DBTableClass";

export const app = new Hono<MeeBindings<MeeAPIEnv>>({
  strict: false,
});

const TableObject = new DBTableClass<CharacterDataType>({
  table: "characters",
  createEntry: {
    id: { primary: true },
    key: { type: "TEXT", unique: true, notNull: true },
    name: { type: "TEXT" },
    honorific: { type: "TEXT" },
    defEmoji: { type: "TEXT" },
    overview: { type: "TEXT" },
    description: { type: "TEXT" },
    tags: { type: "TEXT" },
    order: { type: "INTEGER" },
    draft: { type: "INTEGER" },
    playlist: { type: "TEXT" },
    icon: { type: "TEXT" },
    image: { type: "TEXT" },
    headerImage: { type: "TEXT" },
    embed: { type: "TEXT" },
    birthday: { type: "TEXT" },
    time: { type: "TEXT" },
    lastmod: { createAt: true, unique: true },
  },
  insertEntryKeys: ["key", "name", "honorific", "defEmoji", "overview", "description", "tags", "order", "draft", "playlist", "icon", "headerImage", "image"],
  insertEntryTimes: ["time", "birthday", "lastmod"]
});

app.use("*", async (c, next) => {
  if (IsLogin(c)) return next();
  else return c.text("403 Forbidden", 403)
});

export async function ServerCharactersGetData(searchParams: URLSearchParams, db: MeeSqlD1, isLogin?: boolean) {
  const wheres: MeeSqlFindWhereType<CharacterDataType>[] = [];
  const lastmod = searchParams.get("lastmod");
  if (lastmod) wheres.push({ lastmod: { gt: lastmod } });
  const key = searchParams.get("key");
  if (key) wheres.push({ key });
  const id = searchParams.get("id");
  if (id) wheres.push({ id: Number(id) });
  async function Select() {
    return TableObject.Select({ db, where: { AND: wheres } })
      .then(data => isLogin ? data : data.map(v => v.draft ? { ...v, ...TableObject.getFillNullEntry, key: null } : v));
  }
  return Select().catch(() => TableObject.CreateTable({ db }).then(() => Select()));
}

app.post("/send", async (c, next) => {
  const db = new MeeSqlD1(c.env.DB);
  const rawData = await c.req.json();
  const data = Array.isArray(rawData) ? rawData : [rawData];
  const now = new Date();
  return Promise.all(
    data.map(async item => {
      const { id: _id, ...data } = item;
      const entry = TableObject.getInsertEntry(data);
      entry.lastmod = now.toISOString();
      now.setMilliseconds(now.getMilliseconds() + 1);
      const target_id = data.target || data.key;
      const target = target_id
        ? (await TableObject.Select({ db, where: { key: target_id }, take: 1 }))[0]
        : undefined;
      if (target) {
        entry.key = data.id;
        await TableObject.Update({ db, entry, take: 1, where: { key: target_id! } });
        return { type: "update", entry: { ...target, ...entry } };
      } else {
        entry.key = data.key || target_id;
        await TableObject.Insert({ db, entry });
        return { type: "create", entry }
      }
    })
  ).then(results => {
    return c.json(results, results.some(({ type }) => type === "create") ? 201 : 200);
  });
});

app.post("/import", async (c, next) => {
  const db = new MeeSqlD1(c.env.DB);
  const object = await c.req.json() as importEntryDataType<CharacterDataType>;
  if (object.data) {
    if (object.overwrite) {
      await TableObject.Drop({ db });
      await TableObject.CreateTable({ db });
    }
    const list = object.data;
    if (Array.isArray(list)) {
      lastModToUniqueNow(list as KeyValueType<any>);
      await PromiseOrder(list.map((item) => () =>
        TableObject.Insert({ db, entry: TableObject.getInsertEntry(item) })
      ), { sleepTime: 0 });
      return c.text("インポートしました！")
    }
  }
  return c.text("インポートに失敗しました", 500);
})

app.delete("/send", async (c) => {
  const data = await c.req.json();
  const key = data.target;
  if (key) {
    const db = new MeeSqlD1(c.env.DB);
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

app.delete("/all", async (c, next) => {
  if (c.env.DEV) {
    const db = new MeeSqlD1(c.env.DB);
    await TableObject.Drop({ db });
    return c.json({ message: "successed!" });
  }
  return next();
});

export const app_character_api = app;
