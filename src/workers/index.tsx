/* ※このページはCloudflareの認証前提になってます */

import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { app_twix } from "./twix/twixPage";
import { app_noticeFeed } from "./notice-feed";
import { renderHtml } from "@src/functions/render";
import { ServerSimpleLayout, ServerSimpleLayoutProps } from "@src/serverLayout";
import { FeedSet } from "@src/ServerContent";
import { LoginCheckMiddleware, LoginRoute, Logout } from "../admin";

export const app = new Hono<MeeBindings>();

app.route("/login", LoginRoute());
app.get("/logout", (c) => Logout(c));
app.use("*", LoginCheckMiddleware);
app.route("/notice-feed", app_noticeFeed);
app.route("/twix", app_twix);
app.get("/info", async (c) => {
  return c.json({ ...c, ...{ cookie: getCookie(c) } });
});
app.get("/feed-update", async (c) => {
  await FeedSet({ env: c.env, minute: 1 });
  return c.redirect("/");
});
app.get("/", async (c) => {
  const Url = new URL(c.req.url);
  const cookieKey = "VisibleWorkers";
  const switchCookieKey = "viewCookie";
  if (Url.searchParams.has(switchCookieKey)) {
    const cookieMode = Url.searchParams.get(switchCookieKey);
    if (cookieMode === "on") {
      setCookie(c, cookieKey, "on", {
        maxAge: 34e6,
        domain: c.env.ORIGIN_HOST,
      });
    } else if (cookieMode === "off") {
      deleteCookie(c, cookieKey);
    }
    return c.redirect(Url.pathname);
  }
  return c.html(
    renderHtml(
      <WorkersLayout title="めぇめぇワーカー" className="h1h4Page">
        <h1>めぇめぇワーカー</h1>
        <div className="flex center column font-larger">
          <a href="/workers/feed-update">フィードの更新</a>
          <a href="/workers/notice-feed">めぇめぇつうしん</a>
          <a href="/workers/twix">Twitterれんけい</a>
          <a href="/workers/info">サーバーの情報</a>
          <a href="/workers/logout">ログアウト</a>
          <a href="/">ホームページへ戻る</a>
        </div>
      </WorkersLayout>
    )
  );
});

export function WorkersLayout({ className, ...args }: ServerSimpleLayoutProps) {
  return (
    <ServerSimpleLayout
      {...args}
      className={"workers" + (className ? " " + className : "")}
    />
  );
}

export const app_workers = app;
