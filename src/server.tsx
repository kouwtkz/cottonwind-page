import axios from "axios";
import { discordInviteMatch } from "./ServerContent";
import { app_blog } from "./components/blog";
import { CommonHono } from "./types/HonoCustomType";
import { app_workers } from "./workers";

export function ServerCommon(app: CommonHono) {
  app.route("/workers", app_workers);
  app.route("/blog", app_blog);
  app.get("/fetch/discord/invite", async (c) => {
    return discordInviteMatch(c);
  });
}
