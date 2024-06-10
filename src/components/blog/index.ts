import { Hono } from "hono";
import { getPostsData, setPostsData } from "./postDataFunction";
import { MakeRss } from "./functions/GeneratePosts";
import { IsLogin } from "@/ServerContent";

export const app = new Hono<MeeBindings>();

type PostFormType = {
  title?: string;
  body?: string;
  category?: string[];
  pin?: number;
  draft?: boolean;
  date?: Date;
  postId?: string;
  userId?: string;
};

app.post("/send", async (c) => {
  if (!IsLogin(c)) return new Response("ログインしていません", { status: 403 });
  const formData = await c.req.formData();
  let success = false;

  const userId = import.meta.env.VITE_AUTHOR_ACCOUNT;

  const data = {} as PostFormType & Post;

  let postId = String(formData.get("postId"));
  const update = String(formData.get("update"));
  if (postId !== update) data.postId = postId;

  const title = formData.get("title");
  if (title !== null) data.title = String(title);

  const body = formData.get("body");
  if (body !== null || !update) data.body = String(body || "");

  const category = formData.get("category");
  if (category !== null) data.category = String(category).split(",");

  const pin = formData.get("pin");
  if (pin !== null) data.pin = Number(pin);

  const draft = formData.get("draft");
  if (draft !== null) data.draft = draft !== "false";

  const date = formData.get("date");
  if (date !== null) {
    if (date === "") {
      data.date = new Date();
    } else {
      const stringDate = String(date);
      if (stringDate.endsWith("Z") || /\+/.test(stringDate))
        data.date = new Date(stringDate);
      else data.date = new Date(`${stringDate}+09:00`);
    }
  }

  // あとで保存用の書き出しにする
  if (!success) success = Object.keys(data).length > 0;
  if (success) {
    const posts = await getPostsData(c);
    if (update) {
      const updateData = posts.find((post) => post.postId === update);
      if (updateData) {
        Object.entries(data).forEach(([k, v]) => {
          (updateData as any)[k] = v;
        });
        updateData.updatedAt = new Date();
      }
    } else {
      postId = postId || autoPostId();
      const maxId = Math.max(...posts.map((post) => post.id || 0));
      const now = new Date();
      posts.push({
        ...({
          id: maxId + 1,
          postId,
          userId,
          title: "",
          body: "",
          category: [],
          pin: 0,
          noindex: false,
          draft: false,
          date: now,
          updatedAt: now,
          flags: null,
          memo: null,
        } as Post),
        ...data,
      });
    }
    await setPostsData(c, posts);
    return c.json({ postId });
  } else {
    return c.json({ error: "更新するデータがありません" }, { status: 500 });
  }
});

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

app.get("/posts.json", async (c) => {
  try {
    const posts = await getPostsData(c);
    if ('dl' in c.req.query() && IsLogin(c))
      return c.newResponse(JSON.stringify(posts), {
        headers: {
          "Content-Type": "application/octet-stream",
        },
      });
    return c.json(posts);
  } catch (e) {
    console.error(e);
    return c.json([]);
  }
});

app.get("/rss.xml", async (c) => {
  return new Response(await MakeRss(c), {
    headers: {
      "Content-Type": "application/xml",
    },
  });
});

export const app_blog = app;
