import { FeedOptions, ItemOptions } from "rss";
import { DOMImplementation, DOMParser, XMLSerializer } from "xmldom";

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