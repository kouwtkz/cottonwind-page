import { Next } from "hono";
import { CommonContext } from "./types/HonoCustomType";
import { DOMParser } from "xmldom";
import xpath from "xpath";
import { getCookie } from "hono/cookie";

export const XmlHeader = {
  headers: { "Content-Type": "application/xml; charset=UTF-8" },
}
const isLocalhostReg = /^http\:\/\/(localhost|127\.0\.0\.1)[/:\/]/;

export function IsLogin(c: CommonContext) {
  return import.meta.env.DEV
    || (Boolean(getCookie(c, "CF_Authorization")) && c.env?.LOGIN_TOKEN === getCookie(c, "LoginToken"))
    || isLocalhostReg.test(c.req.url)
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
  const invite_password = Url.searchParams.get("invite_password");
  if (invite_password) {
    if (c.env.DISCORD_INVITE_URL && c.env.DISCORD_INVITE_ANSWER === invite_password) {
      return c.newResponse(c.env.DISCORD_INVITE_URL);
    } else return c.newResponse("failed", { status: 401 })
  } else if (c.env.DISCORD_INVITE_QUESTION) {
    return c.newResponse(c.env.DISCORD_INVITE_QUESTION);
  } else return c.text("")
}

async function TrimTrailingContext(c: CommonContext, next: Next) {
  const Url = new URL(c.req.url);
  if (/.+\/+$/.test(Url.pathname)) {
    Url.pathname = Url.pathname.replace(/\/+$/, "");
    return c.redirect(Url.href);
  } else return next();
}

export async function RssFeedGet(
  url: string, { limit = 3 }: { limit?: number } = {}
) {
  const text = await fetch(url).then(r => r.text());
  const p = new DOMParser();
  const xml = p.parseFromString(text);
  const select = xpath.useNamespaces(Object.fromEntries(
    Object.values(xml.documentElement.attributes)
      .filter(({ prefix }) => prefix === "xmlns")
      .map(item => ([item.localName, item.value]))))
  const title = select("string(/rss/channel/title)", xml) as string;
  const link = select("string(/rss/channel/link)", xml) as string;
  const description = select("string(/rss/channel/description)", xml) as string;
  const list = (select(`/rss/channel/item[position()<=${limit}]`, xml)! as Node[]).map(item => {
    return {
      title: select("string(title)", item) as string || (select("string(description)", item) as string).slice(0, 128),
      link: select("string(link)", item) as string,
      date: select("string(pubDate)", item) as string,
      category: (select("category/text()", item) as Node[]).map(v => v.nodeValue!)
    }
  });
  const feed: FeedContentType = { title, link, description, list };
  return feed;
}

export async function ZenScrapGet(
  apiUrl: string,
  { reverse = false, include_pinned = true, limit = 100 }
    : { reverse?: boolean, include_pinned?: boolean, limit?: number } = {}
) {
  const scrap = (await fetch(apiUrl).then(r => r.json()) as any).scrap;
  const scrapObject: ZennScrapType = { url: "https://zenn.dev" + scrap.path, title: scrap.title };
  let comments: any[] = scrap?.comments ?? [];
  if (reverse) comments.reverse();
  if (!include_pinned) comments = comments.filter(v => !v.pinned);
  scrapObject.list = comments.slice(0, limit)
    .map((v) => ({
      id: v.id, created_at: v.created_at, body_html: v.body_html
    }));
  return scrapObject;
}

export async function FeedSet({ url, c, minute = 5 }: { url?: string, c: CommonContext, minute?: number }) {
  if (!url) url = c.env.FEED_FROM;
  const keyName = "regular";
  const tableName = "Feed";
  const dbData = await c.env.DB.prepare(`SELECT * FROM ${tableName} where name = ?`).bind(keyName).first() as (FeedDBType | null);
  const feedStr = dbData?.data;
  let feedObj = (feedStr ? JSON.parse(feedStr) : {}) as FeedContentsType;
  const doProcess = dbData?.date ? new Date().getTime() - new Date(dbData.date).getTime() > 6e4 * minute : true;
  if (doProcess) {
    let note: FeedContentType | undefined;
    if (url) note = await RssFeedGet(url);
    const updateFeedObj = { note };
    const updateFeedObjStr = JSON.stringify(updateFeedObj);
    const date = new Date().toISOString();
    if (dbData) {
      if (updateFeedObjStr !== feedStr) {
        feedObj = updateFeedObj;
        await c.env.DB.prepare(`UPDATE ${tableName} SET date = ?, data = ? WHERE name = ?`).bind(date, updateFeedObjStr, keyName).run();
      } else await c.env.DB.prepare(`UPDATE ${tableName} SET date = ? WHERE name = ?`).bind(date, keyName).run();
    } else await c.env.DB.prepare(`INSERT INTO ${tableName}(name, date, data) VALUES(?, ?, ?)`).bind(keyName, date, updateFeedObjStr).run();
  }
  return feedObj;
}
