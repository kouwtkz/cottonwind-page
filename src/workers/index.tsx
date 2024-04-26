import { Hono } from "hono";
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
  return c.html(
    renderToString(
      <WorkersLayout title="めぇめぇワーカー">
        <h1>めぇめぇワーカー</h1>
        <a href="/workers/notice-feed">めぇめぇつうしん</a>
        <a href="/workers/twix">Twitterれんけい</a>
      </WorkersLayout>
    )
  );
});

export function WorkersLayout({
  title,
  meta,
  style = defaultStyle,
  children,
}: {
  title: string;
  meta?: React.ReactNode;
  style?: React.ReactNode;
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
      <body className="workers">{children}</body>
    </html>
  );
}

export const app_workers = app;
