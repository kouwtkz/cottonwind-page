import { Next } from "hono";
import { CommonContext } from "./types/HonoCustomType";
import { DOMParser } from "xmldom";
import xpath from "xpath";

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
    if (url) {
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
      const list = (select("/rss/channel/item[position()<4]", xml)! as Node[]).map(item => ({
        title: select("string(title)", item) as string,
        description: select("string(description)", item) as string,
        link: select("string(link)", item) as string,
        date: select("string(pubDate)", item) as string,
        category: (select("category/text()", item) as Node[]).map(v => v.nodeValue!)
      }));
      note = { title, link, description, list }
    }
    let changeLog: ZennChangeLogType | undefined;
    if (c.env.ZENN_UPDATE_FROM) {
      const scrap = (await fetch(c.env.ZENN_UPDATE_FROM).then(r => r.json()) as any).scrap;
      changeLog = { url: "https://zenn.dev" + scrap.path, title: scrap.title };
      changeLog.list = (scrap?.comments as any[])
        ?.reverse()
        .filter(v => !v.pinned)
        .slice(0, 100)
        .map((v) => ({
          id: v.id, created_at: v.created_at, body_html: v.body_html
        }));
    }
    const updateFeedObj = { note, changeLog };
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
