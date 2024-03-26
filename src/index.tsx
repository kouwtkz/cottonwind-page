import { Hono } from "hono";
import { renderToString } from "react-dom/server";
import { DefaultBody, DefaultMeta, SetMetaServerSide } from "./serverLayout";

const app = new Hono();

app.get("/check", (c, next) => {
  return next();
});

app.get("*", (c) => {
  return c.html(
    renderToString(
      <html>
        <head>
          <DefaultMeta />
          <SetMetaServerSide path={c.req.path} />
          <script type="module" src="/static/client.js" />
          <link rel="stylesheet" href="/static/styles.css" />
        </head>
        <DefaultBody />
      </html>
    )
  );
});

export default app;
