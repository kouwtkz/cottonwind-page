import { HonoRequest } from "hono";
import { serverConfig } from "./data/server/config";
import { CommonContext } from "./types/ConfigSiteType";

export const XmlHeader = {
  headers: { "Content-Type": "application/xml; charset=UTF-8" },
}

export async function FetchBody(src?: string) {
  try {
    if (src) return (await fetch(src)).body
    else return "";
  } catch {
    return "";
  }
}

export async function FetchText(src?: string) {
  try {
    if (src) return await (await fetch(src)).text()
    else return "";
  } catch {
    return "";
  }
}

export async function discordInviteMatch(c: CommonContext) {
  const Url = new URL(c.req.url);
  const env = c.env as any;
  const invite_password = Url.searchParams.get("invite_password");
  if (invite_password) {
    if (env.DISCORD_INVITE_ANSWER === invite_password) {
      return c.newResponse(env.DISCORD_INVITE_URL);
    } else return c.newResponse("failed", { status: 401 })
  } else {
    return c.newResponse(env.DISCORD_INVITE_QUESTION);
  }
}