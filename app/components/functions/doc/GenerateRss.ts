import type { FeedOptions, ItemOptions } from "rss";
import { DOMImplementation, DOMParser, XMLSerializer } from "xmldom";
import type { MeeSqlClass } from "~/data/functions/MeeSqlClass";
import { concatOriginUrl, getMediaOrigin } from "../originUrl";
import { ImageSelectFromKey } from "../media/serverDataFunction";
import { DEFAULT_LANG, TITLE } from "~/Env";
import { parse } from "marked";

function CData(str: string) {
  return `<![CDATA[ ${str} ]]>`;
}

interface Options extends FeedOptions {
  items?: ItemOptions[];
}

export default function GenerateRss(options: Options) {
  const xsl = new XMLSerializer();
  const xmlDom = new DOMImplementation();
  const xmlDoc = xmlDom.createDocument(null, null);
  const xmlRss = xmlDoc.createElement("rss");
  const xmlChannel = xmlDoc.createElement("channel");
  const p = new DOMParser();
  const entries = [
    `<title>${options.title}</title>`,
    `<description>${CData(options.description ?? "")}</description>`,
    `<link>${options.site_url}</link>`
  ]
  if (options.image_url) {
    entries.push(`<image>${[
      `<url>${options.image_url}</url>`,
      `<title>${options.title}</title>`,
      `<link>${options.site_url}</link>`
    ].join('')}</image>`)
  }
  entries.push(`<generator>RSS for Node</generator>`);
  entries.push(`<lastBuildDate>${options.pubDate || new Date().toUTCString()}</lastBuildDate>`);
  entries.push(`<language>${options.language ?? 'ja'}</language>`);
  xmlChannel.appendChild(p.parseFromString(entries.join(''), "application/xml"));
  options.items?.forEach(item => {
    const xmlItem = xmlDoc.createElement("item");
    const entries = [
      `<title>${CData(item.title)}</title>`,
      `<description>${CData(item.description)}</description>`,
      `<link>${item.url}</link>`,
      `<guid isPermaLink="false">${item.url}</guid>`,
      `<pubDate>${new Date(item.date).toUTCString()}</pubDate>`
    ];
    xmlItem.appendChild(p.parseFromString(entries.join(''), "application/xml"));
    xmlChannel.appendChild(xmlItem);
  })
  xmlRss.appendChild(xmlChannel);
  xmlDoc.appendChild(xmlRss);
  return `<?xml version="1.0" encoding="UTF-8"?>` + xsl.serializeToString(xmlDoc);
}

interface MakeRssProps {
  env: Partial<Env>;
  db: MeeSqlClass;
  url: string;
  postsData: PostDataType[];
}
export async function MakeRss({ env, db, url, postsData }: MakeRssProps) {
  const Url = new URL(url);
  const SITE_URL = Url.origin;
  const mediaOrigin = getMediaOrigin(env, SITE_URL);
  const imagesDataMap = new Map<string, ImageDataType>();
  async function getImagesData(key?: string | null) {
    let imageData: ImageDataType | undefined;
    if (key) {
      imageData = imagesDataMap.get(key);
      if (!imageData) {
        imageData = await ImageSelectFromKey(db, key);
        if (imageData) imagesDataMap.set(key, imageData);
      }
    }
    return imageData;
  }
  let image_url: string | undefined;
  if (env.SITE_IMAGE) {
    const data = await getImagesData(env.SITE_IMAGE);
    if (data) image_url = data.src || undefined;
  }
  if (image_url && mediaOrigin)
    image_url = concatOriginUrl(mediaOrigin, image_url);
  return GenerateRss(
    {
      title: TITLE || "",
      description: env.DESCRIPTION,
      feed_url: `${SITE_URL}/rss.xml`,
      site_url: SITE_URL + "/blog",
      language: DEFAULT_LANG,
      image_url,
      pubDate: new Date(postsData.reduce((a, c) => {
        const lastmod = c.lastmod || "";
        return a > lastmod ? a : lastmod
      }, "")).toUTCString(),
      items:
        await Promise.all(postsData.map(async (post) => {
          let Url = new URL("/blog?postId=" + post.postId, SITE_URL);
          let description = String(parse(post.body || "", { async: false }));
          description = description.replace(/(href=")([^"]+)(")/g, (m, m1, m2, m3) => {
            if (!/^https?\:\/\//.test(m2)) {
              if (/^[^\/\?\#]/.test(m2)) m2 = "/" + m2;
              return m1 + SITE_URL + m2 + m3;
            } else return m;
          })
          const matches = Array.from(description.matchAll(/(<img .*src=")(\?[^"]+)(".*>)/g));
          let index = 0;
          let replaceDescription = "";
          for (const m of matches) {
            replaceDescription = replaceDescription + description.slice(index, m.index);
            index = m.index + m[0].length;
            const searchParams = new URLSearchParams(m[2]);
            const alt_m = String(m).match(/alt="([^"]+)"/);
            let alt = alt_m ? alt_m[1] : "";
            const s = { ...Object.fromEntries(Url.searchParams), ...Object.fromEntries(searchParams) };
            const href = Url.origin + Url.pathname + "?" + String(new URLSearchParams(s));
            const imageData = await getImagesData(searchParams.get("image")!);
            if (imageData) {
              alt = alt || imageData.title || "";
              replaceDescription = `<a href="${href}"><img alt="${alt}" src="${concatOriginUrl(mediaOrigin, imageData.src)}" /></a>`
            } else {
              replaceDescription = `<a href="${href}">[画像]${alt}</a>`
            }
          }
          if (replaceDescription) {
            description = replaceDescription + description.slice(index);
          }
          return ({
            title: post.title || "",
            description,
            url: Url.href,
            guid: `${SITE_URL}/blog?postId=${post.postId}`,
            date: post.time ? new Date(post.time) : new Date(0),
          })
        }))
    }
  )
}
