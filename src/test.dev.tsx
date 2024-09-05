import { Hono } from "hono";

export const app = new Hono<MeeBindings>({ strict: false });

app.get("/", async (c) => {
  console.log(c.env)
  return c.json(c.req);
});
app.get("/cf", async (c) => {
  console.log(c.req.header("cf-connecting-ip"));
  return c.json((c.req.raw as any).cf);
});

export const app_test = app;
