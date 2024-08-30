import { Hono } from "hono";
import { MeeSqlD1 } from "./functions/MeeSqlD1";

export const app = new Hono<MeeBindings>({ strict: false });

app.get("/", async (c) => {
  return c.json(c.req);
});
app.get("/cf", async (c) => {
  console.log(c.req.header("cf-connecting-ip"));
  return c.json((c.req.raw as any).cf);
});

let defaultTable = "sample";
const pathes = ["", "/:name"];

pathes.forEach((n) => {
  app.get(`/d1${n}/insert`, async (c) => {
    const table = c.req.param("name") ?? defaultTable;
    const db = new MeeSqlD1(c.env.DB);
    await db
      .createTable({ table, entry: { text: "めぇ" } })
      .catch(() => {});
    await db.insert({ table, entry: { text: "mee3" } });
    return c.text("追加しました");
  });
  app.get(`/d1${n}/select`, async (c) => {
    const table = c.req.param("name") ?? defaultTable;
    const db = new MeeSqlD1(c.env.DB);
    const result = await db.select({ table }).catch(() => []);
    return c.json(result);
  });
  app.get(`/d1${n}/delete`, async (c) => {
    const table = c.req.param("name") ?? defaultTable;
    const db = new MeeSqlD1(c.env.DB);
    db.dropTable(table);
    return c.text(table + "を削除しました");
  });
});

export const app_test = app;
