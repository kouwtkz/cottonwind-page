import { Next } from "hono";
import { CommonContext } from "./types/HonoCustomType";
import { JSDOM } from "jsdom";

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
  let { last, ...kv_feed } = await c.env.KV.get("feed", "json") as FeedKVType;
  const doProcess = last ? new Date().getTime() - new Date(last).getTime() > 6e4 * minute : true;
  if (doProcess) {
    let note: FeedContentType | undefined;
    if (url) {
      const xml = await JSDOM.fromURL(url);
      const dom = xml.window.document;
      const title = dom.querySelector("title")?.textContent!;
      const link = dom.querySelector("link")?.textContent!;
      const description = dom.querySelector("description")?.textContent!;
      const articles = Array.from(
        dom.querySelectorAll(`item:nth-of-type(-n+${100})`)
      );
      const list = articles.map((item) => {
        return {
          title: item.querySelector("title")?.textContent!,
          description: item.querySelector("description")?.textContent!,
          link: item.querySelector("link")?.textContent!,
          category: Array.from(item.querySelectorAll("category")).map(
            (el) => el.textContent!
          ),
          date: item.querySelector("pubDate")?.textContent!,
        };
      });
      note = { title, link, description, list }
    }
    let changeLog: ZennChangeLogType | undefined;
    if (c.env.ZENN_UPDATE_FROM) {
      const scrap = (await fetch(c.env.ZENN_UPDATE_FROM).then(r => r.json()) as any).scrap;
      changeLog = { url: "https://zenn.dev" + scrap.path, title: scrap.title };
      changeLog.list = (scrap?.comments as any[])
        ?.filter(v => !v.pinned)
        .map((v) => ({
          id: v.id, created_at: v.created_at, body_html: v.body_html
        }));
      changeLog.list?.reverse();
    }
    kv_feed = { note, changeLog };
    c.env.KV.put("feed", JSON.stringify({ last: new Date(), ...kv_feed }));
  }
  return kv_feed;
}