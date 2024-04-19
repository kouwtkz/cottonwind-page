import { HonoRequest } from "hono";
import { serverConfig } from "../server/config";
import xpath from "xpath";
import { DOMParser } from "xmldom"

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

export async function discordInviteMatch(req: HonoRequest<string, any>) {
  return serverConfig.discordInvite &&
    (await req.json()).invite_password === serverConfig.discordInvitePassword
    ? serverConfig.discordInvite
    : null;
}

