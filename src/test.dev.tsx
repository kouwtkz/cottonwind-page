import { Hono } from "hono";

export const app = new Hono<MeeBindings>({ strict: false });

app.get("/", async (c) => {
  console.log(c.env)
  return c.json(request);
});
app.get("/cf", async (c) => {
  console.log(request.header("cf-connecting-ip"));
  return c.json((request.raw as any).cf);
});

export const app_test = app;
