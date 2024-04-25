import { Hono } from "hono";
import { renderToString } from "react-dom/server";
import { HtmlLayout } from ".";

const app = new Hono();
app.get("/", (c) => {
	return c.html(renderToString(<TopPage />));
});

const defaultTitle = "めぇめぇつうしん";

export function TopPage() {
  const layoutAttr = { title: defaultTitle };
  return (
    <HtmlLayout {...layoutAttr}>
      <h1>{defaultTitle}</h1>
      <a href="/workers/twix">Twitterれんけい</a>
      <a href="/workers">ワーカーページにもどる</a>
    </HtmlLayout>
  );
}

export const app_noticeFeed = app;
