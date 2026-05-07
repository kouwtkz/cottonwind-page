import { DOMParser } from "xmldom";

export async function GetRSS(href: string) {
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
    }, 200);
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
  }).catch(e => { console.error(e) });
}

export async function GetRSSFromEnv({ env }: { env?: Partial<Env> }) {
  if (env?.EXT_RSS) {
    return Promise.all(env.EXT_RSS.split(",").map(href => GetRSS(href)));
  } else return null;
}