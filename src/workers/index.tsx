import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { app_twix } from "./twix/twixPage";
import { app_noticeFeed } from "./notice-feed";
import { renderToString } from "react-dom/server";
import { Style } from "@/serverLayout";
import { FeedSet } from "@/ServerContent";

const defaultStyle = <Style href="/css/styles.css" />;

export const app = new Hono<MeeBindings>();

app.route("/notice-feed", app_noticeFeed);
app.route("/twix", app_twix);
app.get("/info", async (c) => {
  return c.json({ ...c, ...{ cookie: getCookie(c) } });
});
app.get("/feed-update", async (c) => {
  await FeedSet({ c, minute: 1 });
  return c.redirect("/");
});
app.get("/", async (c) => {
  const Url = new URL(c.req.url);
  const cookieKey = "VisibleWorkers";
  const switchCookieKey = "viewCookie";
  if (Url.searchParams.has(switchCookieKey)) {
    const cookieMode = Url.searchParams.get(switchCookieKey);
    if (cookieMode === "on") {
      setCookie(c, cookieKey, "on", { maxAge: 34e6 });
    } else if (cookieMode === "off") {
      deleteCookie(c, cookieKey);
    }
    return c.redirect(Url.pathname);
  }
  const loginToken = getCookie(c, "LoginToken");
  if (loginToken !== c.env?.LOGIN_TOKEN)
    setCookie(c, "LoginToken", String(c.env?.LOGIN_TOKEN), { maxAge: 32e6 });
  const cookieValue = getCookie(c, cookieKey);
  return c.html(
    renderToString(
      <WorkersLayout title="めぇめぇワーカー">
        <h1>めぇめぇワーカー</h1>
        <a href="/workers/feed-update">フィードの更新</a>
        <a href="/workers/notice-feed">めぇめぇつうしん</a>
        <a href="/workers/twix">Twitterれんけい</a>
        <a href="/workers/info">サーバーの情報</a>
        <a href={`?${switchCookieKey}=${cookieValue ? "off" : "on"}`}>
          メニュー{cookieValue ? "から外す" : "に入れる"}
        </a>
        <a href="/">ホームページへ戻る</a>
      </WorkersLayout>
    )
  );
});
app.post("/", async (c) => {});

export function WorkersLayout({
  title,
  meta,
  style = defaultStyle,
  script,
  children,
}: {
  title: string;
  meta?: React.ReactNode;
  style?: React.ReactNode;
  script?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <title>{title}</title>
        {meta}
        {style}
      </head>
      <body className="workers">
        {children}
        {script}
      </body>
    </html>
  );
}

export const app_workers = app;
