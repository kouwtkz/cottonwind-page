import { Hono } from "hono";
import { renderToString } from "react-dom/server";
import { ServerNotFound } from "./serverLayout";

const app = new Hono({ strict: true });

app.get("/404", async (c) => {
  return c.html(renderToString(<ServerNotFound />), { status: 404 });
});

export default app;
