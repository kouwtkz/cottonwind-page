// @ts-check

import { readFileSync } from "fs";
import { load } from "js-yaml";

/**
 * @typedef { import("../../types/SiteDataType.d").SiteDataType } SiteDataType
 * @typedef { import("../../types/SiteDataType.d").SiteAuthorType } SiteAuthorType
 * @typedef { import("../../types/SiteDataType.d").SiteMenuItemType } SiteMenuItemType
 * @typedef { import("../../types/SiteDataType.d").SiteSnsItemType } SiteSnsItemType
 */

const cwd = `${process.cwd()}/${process.env.ROOT || ""}`;

/** @returns { SiteDataType } */
export function getSiteData() {
  /** @type any */
  let rawData = {}
  try {
    rawData = load(readFileSync(`${cwd}/_data/site.yaml`, "utf8"));
  } catch (e) {
    console.error(e);
    rawData = { title: "title", description: "description", short: { description: "short" }, author: { since: 2023 } }
  }
  return rawData;
}

const site = getSiteData();

export { site };