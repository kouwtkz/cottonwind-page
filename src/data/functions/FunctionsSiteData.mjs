// @ts-check

import { readFileSync } from "fs";
import { parse } from "jsonc-parser"
const cwd = `${process.cwd()}/${process.env.ROOT || ""}`;

const siteConfigName = "config.site";
/** @returns { SiteDataType } */
export function readSiteConfig() {
  /** @type any */
  let rawData = {}
  try {
    rawData = parse(readFileSync(`${cwd}/_data/${siteConfigName}.json`, "utf8"));
  } catch (e) {
    console.error(e);
    rawData = { title: "title", description: "description", short: { description: "short" }, author: { since: 2023 } }
  }
  return rawData;
}

const serverConfigName = "config.server";
/** @returns { ServerDataType } */
export function readServerConfig() {
  /** @type any */
  let rawData = {}
  try {
    rawData = parse(readFileSync(`${cwd}/_data/${serverConfigName}.json`, "utf8"));
  } catch (e) {
    console.error(e);
    rawData = {}
  }
  return rawData;
}