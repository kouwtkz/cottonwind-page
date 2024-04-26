import { Hono } from "hono";
import { renderToString } from "react-dom/server";
import { WorkersLayout } from ".";

const app = new Hono();
app.get("/", (c) => {
	return c.html(renderToString(<TopPage />));
});

const defaultTitle = "めぇめぇつうしん";

export function TopPage() {
  const layoutAttr = { title: defaultTitle };
  return (
    <WorkersLayout {...layoutAttr}>
      <h1>{defaultTitle}</h1>
      <a href="/workers/twix">Twitterれんけい</a>
      <a href="/workers">ワーカーページにもどる</a>
    </WorkersLayout>
  );
}

export const app_noticeFeed = app;
