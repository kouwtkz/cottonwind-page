import axios from "axios";
import { discordInviteMatch } from "./ServerContent";
import { app_blog } from "@/blog";
import { CommonHono } from "./types/HonoCustomType";
import { app_workers } from "./workers";

export function ServerCommon(app: CommonHono) {
  app.post("/life/check", async (c) => {
    const body = await c.req.text();
    const result = c.env.LIFE_CHECK_CHALLENGE === body;
    if (result) return c.text(c.env.LIFE_CHECK_VERIFIER ?? "");
    else return c.text("401 Unauthorized", 401);
  });
  app.route("/workers", app_workers);
  app.route("/blog", app_blog);
  app.get("/fetch/discord/invite", async (c) => {
    return discordInviteMatch(c);
  });
}
