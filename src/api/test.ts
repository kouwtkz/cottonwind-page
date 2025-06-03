import { Hono } from "hono";
import { MeeSqlD1 } from "@src/data/functions/MeeSqlD1";


export const app = new Hono<MeeAPIBindings>({ strict: false });

app.get("/", (c) => {
  return c.text("はろーめぇめぇ");
});

let defaultTable = "sample";
const pathes = ["", "/:name"];

pathes.forEach((n) => {
  app.get(`/d1${n}/insert`, async (c) => {
    const table = request.param("name") ?? defaultTable;
    const db = getCfDB({ context });;
    await db.createTable({ table, entry: { text: "めぇ" } }).catch(() => { });
    await db.insert({ table, entry: { text: "mee3" } });
    return c.text("追加しました");
  });
  app.get(`/d1${n}/select`, async (c) => {
    const table = request.param("name") ?? defaultTable;
    const db = getCfDB({ context });;
    const result = await db.select({ table }).catch(() => []);
    return c.json(result);
  });
  app.get(`/d1${n}/delete`, async (c) => {
    const table = request.param("name") ?? defaultTable;
    const db = getCfDB({ context });;
    db.dropTable({ table });
    return c.text(table + "を削除しました");
  });
});

export const app_test_api = app;
