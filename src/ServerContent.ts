import { Next } from "hono";
import { CommonContext } from "./types/HonoCustomType";
import { DOMParser } from "xmldom";
import xpath from "xpath";
import { getCookie, setCookie } from "hono/cookie";

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

export async function discordInviteMatch(c: CommonContext<MeePagesEnv>) {
  const Url = new URL(request.url);
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
  const Url = new URL(request.url);
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

export async function FeedSet({ url, env, minute = 5 }: { url?: string, env: MeeCommonEnv, minute?: number }) {
  if (!url) url = env.FEED_FROM;
  const keyName = "Feed";
  const feedData = await env.KV.get(keyName).then(v => v ? JSON.parse(v) : null) as (FeedDBType | null);
  const feedStr = feedData?.data;
  let feedObj = (feedStr ? JSON.parse(feedStr) : {}) as FeedContentType;
  const doProcess = feedData?.date ? new Date().getTime() - new Date(feedData.date).getTime() > 6e4 * minute : true;
  if (doProcess) {
    let note: FeedContentType | undefined;
    if (url) note = await RssFeedGet(url);
    const date = new Date().toISOString();
    const newKvData: FeedDBType = { data: JSON.stringify({ note }), date }
    env.KV.put(keyName, JSON.stringify(newKvData));
  }
  return feedObj;
}
