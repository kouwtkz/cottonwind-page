import { CommonHono } from "./types/HonoCustomType";

export function honoTest(app: CommonHono) {
  app.get("/test", async (c) => {
    console.log(c.req.header("cf-connecting-ip") ?? "");
    return c.json(c.req.header());
  });
}
