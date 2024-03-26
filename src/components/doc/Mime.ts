import { getExtension } from "./PathParse";

export const mimeList: { [k: string]: string | undefined } = {
  "html": "text/html",
  "htm": "text/html",
  "css": "text/css",
  "js": "application/javascript",
  "json": "application/json",
  "xml": "application/xml",
  "rss": "application/xml",
  "png": "image/png",
  "apng": "image/apng",
  "jpg": "image/jpeg",
  "jpeg": "image/jpeg",
  "svg": "image/svg+xml",
  "gif": "image/gif",
  "webp": "image/webp",
  "webm": "audio/webm",
  "txt": "text/plain",
};

export function getType(path: string) {
  return mimeList[getExtension(path)]
}