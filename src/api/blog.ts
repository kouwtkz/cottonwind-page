import { Hono } from "hono";
import { autoPostId } from "@/functions/blogFunction";
import { IsLogin } from "@/admin";
import { MeeSqlD1 } from "@/functions/database/MeeSqlD1";
import { KeyValueConvertDBEntry, lastModToUniqueNow } from "@/functions/doc/ToFunction";
import { PromiseOrder } from "@/functions/arrayFunction";
import { DBTableClass } from "./DBTableClass";

export const app = new Hono<MeeBindings>();

app.use("*", async (c, next) => {
  if (IsLogin(c)) return next();
  else return c.text("403 Forbidden", 403);
});

const TableObject = new DBTableClass<PostDataType>({
  table: "posts",
  createEntry: {
    id: { primary: true },
    postId: { type: "TEXT", unique: true, notNull: true },
    title: { type: "TEXT" },
    body: { type: "TEXT" },
    category: { type: "TEXT" },
    pin: { type: "INTEGER" },
    noindex: { type: "INTEGER" },
    draft: { type: "INTEGER" },
    memo: { type: "INTEGER" },
    time: { createAt: true, index: true },
    lastmod: { createAt: true, unique: true },
  },
  insertEntryKeys: ["postId", "title", "body", "category", "pin", "draft", "noindex", "memo"],
  insertEntryTimes: ["time", "lastmod"]
});

export async function ServerPostsGetData(searchParams: URLSearchParams, db: MeeSqlD1, isLogin?: boolean) {
  const wheres: MeeSqlFindWhereType<PostDataType>[] = [];
  const lastmod = searchParams.get("lastmod");
  if (lastmod) wheres.push({ lastmod: { gt: lastmod } });
  if (!isLogin) wheres.push({ lastmod: { lte: new Date().toISOString() } });
  const id = searchParams.get("id");
  if (id) wheres.push({ id: Number(id) });
  const postId = searchParams.get("postId");
  if (postId) wheres.push({ postId });
  async function Select() {
    return TableObject.Select({ db, where: { AND: wheres } })
      .then(data => isLogin ? data : data.map(v => v.draft ? { ...v, ...TableObject.getFillNullEntry, key: null } : v));
  }
  return Select().catch(() => TableObject.CreateTable({ db }).then(() => Select()));
}

export async function ServerPostsGetRssData(db: MeeSqlD1, take = 10) {
  return await TableObject.Select({
    db,
    where: {
      OR: [{ draft: null }, { draft: 0 }, { schedule: null }, { schedule: 0 }],
      lastmod: { lte: new Date().toISOString() }
    },
    take,
    orderBy: [{ time: "desc" }],
  })
}

app.post("/send", async (c, next) => {
  const db = new MeeSqlD1(c.env.DB);
  const { id, postId, update, ...data } = await c.req.json() as PostFormType;
  const entry = TableObject.getInsertEntry(data);
  if (postId !== update) entry.postId = postId;
  const target = update
    ? (await TableObject.Select({ db, where: { postId: update }, take: 1 }))[0]
    : undefined;
  const now = new Date().toISOString();
  if (data.time) {
    if (data.time > now) entry.lastmod = data.time;
    else entry.lastmod = now;
  } else if (target?.time) {
    if (target.time <= now) entry.lastmod = now;
  } else entry.lastmod = now;
  if (typeof entry.lastmod === "string") {
    entry.lastmod = await TableObject.addTimeFieldLatest({ db, value: entry.lastmod });
  }
  if (target) {
    await TableObject.Update({ db, entry, where: { postId: update } });
    return c.json({ ...target, ...entry, }, 200);
  } else {
    if (!entry.postId) entry.postId = autoPostId();
    await TableObject.Insert({ db, entry });
    return c.json(entry, 201);
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
      KeyValueConvertDBEntry(list);
      await PromiseOrder(list.map((item) => () =>
        TableObject.Insert({ db, entry: TableObject.getInsertEntry(item) })
      ), { sleepTime: 0 });
      return c.text("インポートしました！")
    }
  }
  return c.text("インポートに失敗しました", 500);
});

app.delete("/all", async (c, next) => {
  if (c.env.DEV) {
    const db = new MeeSqlD1(c.env.DB);
    await TableObject.Drop({ db });
    return c.json({ message: "successed!" });
  }
  return next();
});

export const app_blog_api = app;
