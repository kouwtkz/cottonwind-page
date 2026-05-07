import { DOMParser } from "xmldom";
import type { Route } from "./+types";
import { getCfEnv } from "~/data/cf/getEnv";
import { IsLogin } from "~/components/utils/Admin";

export async function GetExtRSS(href: string) {
  return await new Promise<Response>((resolve, reject) => {
    const controller = new AbortController();
    let successed = false;
    const res = fetch(href, { signal: controller.signal });
    res.then(r => {
      successed = true;
      resolve(r)
    }).catch(e => reject(e));
    setTimeout(() => {
      if (!successed) controller.abort();
    }, 1000);
  }).then(r => r.text()).then<ExtRssType>(text => {
    const DomParser = new DOMParser();
    const xml = DomParser.parseFromString(text);
    const channel = xml.getElementsByTagName("channel")[0];
    const title = channel.getElementsByTagName("title")[0]?.textContent || "";
    const description = channel.getElementsByTagName("description")[0]?.textContent || "";
    const lastBuildDate = channel.getElementsByTagName("lastBuildDate")[0]?.textContent || "";
    const rawItems = Array.from(channel.getElementsByTagName("item"));
    const items = rawItems.map(item => {
      const title = item.getElementsByTagName("title")[0]?.textContent || "";
      const description = item.getElementsByTagName("description")[0]?.textContent || "";
      const pubDate = item.getElementsByTagName("pubDate")[0]?.textContent || "";
      const link = item.getElementsByTagName("link")[0]?.textContent || "";
      const guid = item.getElementsByTagName("guid")[0]?.textContent || "";
      return { title, description, pubDate, link, guid }
    });
    const link = channel.getElementsByTagName("link")[0]?.textContent;
    return { title, description, link, lastBuildDate, items };
  }).catch(e => { console.error(e); return null; });
}

const EXT_RSS_KEY = "EXT_RSS";
async function getExtRSS(EXT_RSS: string) {
  return Promise.all(EXT_RSS.split(",").map(href => GetExtRSS(href)))
    .then(v => v.filter(f => f) as ExtRssType[]);
}
async function GetWriteKV_ExtRSS(EXT_RSS: string, KV: KVNamespace<string>) {
  const nowDate = new Date();
  const extRss = await getExtRSS(EXT_RSS);
  if (extRss) {
    const writeValue = nowDate.toISOString();
    await KV.put(EXT_RSS_KEY, [writeValue, JSON.stringify(extRss)].join(","));
  }
  return [nowDate, extRss] as [Date, ExtRssType[]];
}

export async function GetExtRSSFromEnv({ env }: { env?: Partial<Env> }) {
  let extRss: ExtRssType[] | null = null;
  let writeFlag = false;
  if (env?.EXT_RSS_INTERVAL && env?.KV) {
    const kvValue = await env.KV.get(EXT_RSS_KEY);
    if (kvValue) {
      const now = Date.now();
      const sep = kvValue.indexOf(",");
      const writtenTime = sep >= 0 ? new Date(kvValue.slice(0, sep)) : null;
      if (writtenTime) {
        const diffInMs = Math.abs(writtenTime.getTime() - now);
        const diff = Math.floor(diffInMs / 1000);
        if (diff < env.EXT_RSS_INTERVAL) {
          extRss = JSON.parse(kvValue.slice(sep + 1));
        } else {
          writeFlag = true;
        }
      }
    } else {
      writeFlag = true;
    }
    if (writeFlag) {
      if (!extRss && env.EXT_RSS) {
        extRss = (await GetWriteKV_ExtRSS(env.EXT_RSS, env.KV))[1];
      }
    }
  }
  if (!writeFlag && !extRss && env?.EXT_RSS) {
    extRss = await getExtRSS(env.EXT_RSS);
  }
  return extRss;
}


export async function loader() {
  return new Response("");
}

export async function action({ params, context, request }: Route.ActionArgs) {
  const env = getCfEnv({ context });
  const isLogin = await IsLogin({ env, request, trueWhenDev: true });
  if (isLogin && params.action === "update") {
    if (env.EXT_RSS && env.KV) {
      return Response.json(await GetWriteKV_ExtRSS(env.EXT_RSS, env.KV));
    }
  }
  return new Response("", { status: 501 });
}
