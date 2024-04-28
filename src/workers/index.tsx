import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { app_twix } from "./twix/twixPage";
import { app_noticeFeed } from "./notice-feed";
import { renderToString } from "react-dom/server";
import { Style } from "@/serverLayout";

const defaultStyle = (
  <Style
    href={import.meta.env.DEV ? "/styles.scss" : "/static/css/styles.css"}
  />
);

export const app = new Hono();

app.route("/notice-feed", app_noticeFeed);
app.route("/twix", app_twix);

app.get("/", async (c) => {
  const Url = new URL(c.req.url);
  const cookieKey = "VisibleWorkers";
  const switchCookieKey = "viewCookie";
  if (Url.searchParams.has(switchCookieKey)) {
    const cookieMode = Url.searchParams.get(switchCookieKey);
    if (cookieMode === "on") {
      setCookie(c, cookieKey, "on", { maxAge: 32e6 });
    } else if (cookieMode === "off") {
      deleteCookie(c, cookieKey);
    }
    return c.redirect(Url.pathname);
  }
  const cookieValue = getCookie(c, cookieKey);
  return c.html(
    renderToString(
      <WorkersLayout title="めぇめぇワーカー">
        <h1>めぇめぇワーカー</h1>
        <a href="/workers/notice-feed">めぇめぇつうしん</a>
        <a href="/workers/twix">Twitterれんけい</a>
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