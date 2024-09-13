import { Hono } from "hono";
import { autoPostId, getPostsData, setPostsData } from "@/functions/blogFunction";
import { IsLogin } from "@/ServerContent";
import { MeeSqlD1 } from "@/functions/MeeSqlD1";
import { KeyValueToString, lastModToUniqueNow } from "@/functions/doc/ToFunction";

export const app = new Hono<MeeBindings>();

app.use("*", async (c, next) => {
  if (IsLogin(c)) return next();
  else return c.text("403 Forbidden", 403);
});

const table = "posts";
const createEntry: MeeSqlCreateTableEntryType<PostDataType> = {
  id: { primary: true },
  postId: { type: "TEXT", unique: true, notNull: true },
  title: { type: "TEXT" },
  body: { type: "TEXT" },
  category: { type: "TEXT" },
  pin: { type: "INTEGER" },
  noindex: { type: "INTEGER" },
  draft: { type: "INTEGER" },
  schedule: { type: "INTEGER" },
  memo: { type: "INTEGER" },
  time: { createAt: true, index: true },
  lastmod: { createAt: true, unique: true },
};

async function CreateTable(d1: MeeSqlD1) {
  await d1
    .createTable({
      table,
      entry: createEntry,
    })
    .catch(() => { });
}

interface SelectProps extends Omit<MeeSqlSelectProps<PostDataType>, "table"> {
  db: MeeSqlD1;
}
async function Select({ db, ...args }: SelectProps) {
  function _s() {
    return db.select({ table, ...args });
  }
  return _s().catch(() => CreateTable(db).then(() => _s()))
}

export async function ServerPostsGetData(searchParams: URLSearchParams, db: MeeSqlD1) {
  const wheres: MeeSqlFindWhereType<PostDataType>[] = [];
  const lastmod = searchParams.get("lastmod");
  if (lastmod) wheres.push({ lastmod: { gt: lastmod } });
  const id = searchParams.get("id");
  if (id) wheres.push({ id: Number(id) });
  const postId = searchParams.get("postId");
  if (postId) wheres.push({ postId });
  return Select({ db, where: { AND: wheres } });
}

interface SelectProps extends Omit<MeeSqlSelectProps<PostDataType>, "table"> {
  db: MeeSqlD1;
}
export async function ServerPostsGetRssData(env: MeeCommonEnv, take = 10) {
  const db = new MeeSqlD1(env.DB);
  return await Select({
    db,
    where: {
      OR: [{ draft: null }, { draft: 0 }, { schedule: null }, { schedule: 0 }],
      lastmod: { lte: new Date().toISOString() }
    },
    take,
    orderBy: [{ time: "desc" }],
  })
}

function InsertEntry(data: KeyValueType<any>): MeeSqlEntryType<PostDataType> {
  return {
    postId: data.postId,
    title: data.title,
    body: data.body,
    category: data.category,
    pin: data.pin,
    draft: data.draft,
    schedule: data.schedule,
    noindex: data.noindex,
    memo: data.memo,
    time: data.time
      ? new Date(String(data.time)).toISOString()
      : undefined,
    lastmod: data.lastmod
      ? new Date(String(data.lastmod)).toISOString()
      : undefined,
  };
}

app.post("/send", async (c, next) => {
  const db = new MeeSqlD1(c.env.DB);
  const { id, postId, update, ...data } = (await c.req.parseBody()) as KeyValueType<unknown>;
  if (postId !== update) data.postId = postId;
  const entry = InsertEntry(data);

  const target = update
    ? (
      await db.select<PostDataType>({
        table,
        where: { postId: update },
        take: 1,
      })
    )[0]
    : undefined;
  if (target) {
    await db.update<PostDataType>({
      table,
      entry,
      where: { postId: update! },
      rawEntry: { lastmod: MeeSqlD1.isoFormat() },
    });
    return c.json({ ...target, ...entry, }, 200);
  } else {
    if (!entry.postId) entry.postId = autoPostId();
    await db.insert<PostDataType>({ table, entry });
    return c.json(entry, 201);
  }
});

app.delete("/send", async (c) => {
  const data = await c.req.json();
  const postId = String(data.postId || "");
  if (postId) {
    const db = new MeeSqlD1(c.env.DB);
    const nullEntry = MeeSqlD1.getNullEntry(createEntry);
    try {
      await db.update<PostDataType>({
        table,
        entry: { ...nullEntry, lastmod: new Date().toISOString() },
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
  const formData = await c.req.parseBody();
  if (typeof formData.data === "string") {
    await db.dropTable({ table });
    await CreateTable(db);
    const list = JSON.parse(formData.data) as KeyValueType<unknown>[];
    if (Array.isArray(list)) {
      lastModToUniqueNow(list);
      KeyValueToString(list);
      await Promise.all(list.map((item) => db.insert({ table, entry: InsertEntry(item) })));
      return c.text("インポート完了しました！")
    }
  }
  return c.text("インポートに失敗しました", 500);
});

app.delete("/all", async (c, next) => {
  if (c.env.DEV) {
    const db = new MeeSqlD1(c.env.DB);
    await db.dropTable({ table });
    return c.json({ message: "successed!" });
  }
  return next();
});

export const app_blog_api = app;
