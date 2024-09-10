import { Hono } from "hono";
import { getPostsData, setPostsData } from "@/functions/blogFunction";
import { IsLogin } from "@/ServerContent";
import { MeeSqlD1 } from "@/functions/MeeSqlD1";

export const app = new Hono<MeeBindings>();

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
  flags: { type: "INTEGER" },
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

export async function ServerPostsGetData(searchParams: URLSearchParams, db: MeeSqlD1) {
  const wheres: MeeSqlFindWhereType<PostDataType>[] = [];
  const lastmod = searchParams.get("lastmod");
  if (lastmod) wheres.push({ lastmod: { gt: lastmod } });
  const id = searchParams.get("id");
  if (id) wheres.push({ id: Number(id) });
  const postId = searchParams.get("postId");
  if (postId) wheres.push({ postId });
  function Select() {
    return db.select({ table, where: { AND: wheres } });
  }
  return Select().catch(() => CreateTable(db).then(() => Select()));
}

function InsertEntry(data: KeyValueType<any>): MeeSqlEntryType<PostDataType> {
  return {
    postId: data.postId,
    title: data.title,
    body: data.body,
    category: data.category,
    pin: data.pin,
    draft: data.category,
    flags: data.flags,
    noindex: data.noindex,
    memo: data.memo,
    time: data.time
      ? new Date(String(data.time)).toISOString()
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

app.get("/posts", async (c) => {
  try {
    const posts = await getPostsData(c);
    return c.json(posts);
  } catch (e) {
    console.error(e);
    return c.json([]);
  }
});

// app.post("/send/old", async (c) => {
//   if (!IsLogin(c)) return c.text("ログインしていません", 403);
//   const formData = await c.req.formData();
//   let success = false;

//   const userId = c.env.AUTHOR_ACCOUNT;

//   const data = {} as OldPostFormType & OldPost;

//   let postId = String(formData.get("postId"));
//   const update = String(formData.get("update"));
//   if (postId !== update) data.postId = postId;

//   const title = formData.get("title");
//   if (title !== null) data.title = String(title);

//   const body = formData.get("body");
//   if (body !== null || !update) data.body = String(body || "");

//   const category = formData.get("category");
//   if (category !== null) data.category = String(category).split(",");

//   const pin = formData.get("pin");
//   if (pin !== null) data.pin = Number(pin);

//   const draft = formData.get("draft");
//   if (draft !== null) data.draft = draft !== "false";

//   const date = formData.get("date");
//   if (date !== null) {
//     if (date === "") {
//       data.date = new Date();
//     } else {
//       const stringDate = String(date);
//       if (stringDate.endsWith("Z") || /\+/.test(stringDate))
//         data.date = new Date(stringDate);
//       else data.date = new Date(`${stringDate}+09:00`);
//     }
//   }

//   // あとで保存用の書き出しにする
//   if (!success) success = Object.keys(data).length > 0;
//   if (success) {
//     const posts = await getPostsData(c);
//     if (update) {
//       const updateData = posts.find((post) => post.postId === update);
//       if (updateData) {
//         Object.entries(data).forEach(([k, v]) => {
//           (updateData as any)[k] = v;
//         });
//         updateData.updatedAt = new Date();
//       }
//     } else {
//       postId = postId || autoPostId();
//       const maxId = Math.max(...posts.map((post) => post.id || 0));
//       const now = new Date();
//       posts.push({
//         ...({
//           id: maxId + 1,
//           postId,
//           userId,
//           title: "",
//           body: "",
//           category: [],
//           pin: 0,
//           noindex: false,
//           draft: false,
//           date: now,
//           updatedAt: now,
//           flags: null,
//           memo: null,
//         } as OldPost),
//         ...data,
//       });
//     }
//     await setPostsData(c, posts);
//     return c.json({ postId });
//   } else {
//     return c.json({ error: "更新するデータがありません" }, { status: 500 });
//   }
// });

app.delete("/send", async (c) => {
  if (!IsLogin(c)) return new Response("ログインしていません", { status: 403 });
  const data = await c.req.json();
  const postId = String(data.postId || "");
  if (postId) {
    const posts = await getPostsData(c);
    const deletedPosts = posts.filter((post) => post.postId !== postId);
    if (posts.length !== deletedPosts.length) {
      await setPostsData(c, deletedPosts);
    } else {
      return c.json(
        { result: "error", error: "削除済みです" },
        { status: 500 }
      );
    }
    return c.json({ result: "success", postId });
  } else {
    return c.json({ result: "error", error: "ID未指定です" }, { status: 500 });
  }
});

app.post("/send/all", async (c) => {
  if (!IsLogin(c)) return new Response("ログインしていません", { status: 403 });
  const data = await c.req.json();
  if (Array.isArray(data)) {
    await setPostsData(c, data);
  }
  return c.text("アップロードしました");
});

function autoPostId() {
  const now = new Date();
  const days = Math.floor(
    (now.getTime() - new Date("2000-1-1").getTime()) / 86400000
  );
  const todayBegin = new Date(Math.floor(now.getTime() / 86400000) * 86400000);
  return (
    days.toString(32) +
    ("0000" + (now.getTime() - todayBegin.getTime()).toString(30)).slice(-4)
  );
}

export const app_blog_api = app;
