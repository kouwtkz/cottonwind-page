import axios from "axios";
import { discordInviteMatch } from "./ServerContent";
import { app_blog } from "@/blog";
import { CommonHono } from "./types/HonoCustomType";
import { app_workers } from "./workers";
import { app_api } from "./api";

export function ServerCommon(app: CommonHono) {
  app.route("/api", app_api);
  app.route("/workers", app_workers);
  app.route("/blog", app_blog);
  app.get("/fetch/discord/invite", async (c) => {
    return discordInviteMatch(c);
  });
}
