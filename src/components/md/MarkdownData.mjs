// @ts-check

import { readdirSync, readFileSync } from "fs";
import { resolve } from "path";
const cwd = `${process.cwd()}/${process.env.ROOT || ""}`;
const defaultMarkdownDir = "_data/md"

/**
 * @param {string} path 
 * @returns { Array<string> }
 */
function readdirList(path) {
  try {
    return readdirSync(path, { recursive: true, withFileTypes: true })
      .filter((dir) => dir.isFile())
      .map(({ path, name }) => resolve(`${path}/${name}`));
  } catch {
    return [];
  }
}
/** @typedef { import("./MarkdownDataType.d").MarkdownListDataType } MarkdownListDataType */

/**
 * @param {string} [path=""] 
 * @returns { Array<MarkdownListDataType> }
 */
export function MarkdownListData(path = "") {
  const parent = resolve(`${cwd}/${defaultMarkdownDir}/${path}`);
  return readdirList(parent).map(path =>
  ({
    name: path.replace(parent, "").replaceAll("\\", "/").slice(1),
    content: String(readFileSync(path))
  }));
}

/**
 * @param {string} [path=""]
 */
export function MarkdownDataObject(path) {
  /** @type {{[k:string]: string}} */
  const mdObj = {};
  MarkdownListData(path).forEach(({ name, content }) => { mdObj[name] = content });
  return mdObj;
}

/**
 * @param {string} path 
 */
export function GetMarkdownData(path) {
  const fullPath = resolve(`${cwd}/${defaultMarkdownDir}/${path}`);
  try {
    return String(readFileSync(fullPath));
  } catch {
    return "";
  }
}

