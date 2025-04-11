import { Hono } from "hono";
import { autoPostId } from "@/functions/blogFunction";
import { IsLogin } from "@/admin";
import { MeeSqlD1 } from "@/data/functions/MeeSqlD1";
import { DBTableClass, DBTableImport } from "./DBTableClass";
import { postsDataOptions } from "@/data/DataEnv";
import { UpdateTablesDataObject } from "./DBTablesObject";
import { GetDataProps } from "./propsDef";

export const app = new Hono<MeeBindings>();

app.use("*", async (c, next) => {
  if (IsLogin(c)) return next();
  else return c.text("403 Forbidden", 403);
});

const TableObject = new DBTableClass<PostDataType>({
  table: postsDataOptions.name,
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

export async function ServerPostsGetData({ searchParams, db, isLogin }: GetDataProps) {
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
      .then(data => isLogin ? data : data.map((v) => v.draft ? { ...v, ...TableObject.getFillNullEntry, draft: v.draft } : v));
  }
  return Select().catch(() => TableObject.CreateTable({ db })
    .then(() => UpdateTablesDataObject({ db, options: postsDataOptions }))
    .then(() => Select()));
}

export async function ServerPostsGetRssData(db: MeeSqlD1, take = 10) {
  return await TableObject.Select({
    db,
    where: {
      OR: [{ draft: null }, { draft: 0 }],
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
  entry.lastmod = await TableObject.getClassifyScheduleValue({
    db,
    time: data.time,
    existTime: target?.time,
  });
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
  return DBTableImport({
    db: new MeeSqlD1(c.env.DB),
    object: await c.req.json(),
    TableObject,
    idKey: "postId",
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

export const app_blog_api = app;
