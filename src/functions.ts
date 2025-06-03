import { CommonHono } from "./types/HonoCustomType";

export function honoTest(app: CommonHono) {
  app.post("/test", async (c) => {
    console.log(request.header("cf-connecting-ip") ?? "");
    return c.json(request.header());
  });
}
