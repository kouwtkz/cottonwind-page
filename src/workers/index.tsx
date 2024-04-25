import { Hono } from "hono";
import { app_twix } from "./twix/twixPage";
import { app_noticeFeed } from "./notice-feed";
import { renderToString } from "react-dom/server";

export const app = new Hono();
app.route("/notice-feed", app_noticeFeed);
app.route("/twix", app_twix);

app.get("/", (c)=>{
	return c.html(renderToString(<HtmlLayout title="めぇめぇワーカー">
    <h1>めぇめぇワーカー</h1>
    <a href="/workers/notice-feed">めぇめぇつうしん</a>
    <a href="/workers/twix">Twitterれんけい</a>
  </HtmlLayout>));
})

export function HtmlLayout({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <title>{title}</title>
        <link
          rel="stylesheet"
          href={import.meta.env.DEV ? "/src/styles.css" : "/static/styles.css"}
        />
      </head>
      <body className="workers">
        <div id="root" />
        {children}
      </body>
    </html>
  );
}

export const app_workers = app;
