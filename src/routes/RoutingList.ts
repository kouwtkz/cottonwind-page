export const RoutingList = [
  "/", "character", "character/:charaName",
  "gallery", "gallery/ebook", "gallery/:group",
  "sound", "about", "links",
  "works", "contact", "blog", "blog/post",
  "setting", "setting/:key", "suggest",
] as const;
export type RoutingUnion = typeof RoutingList[number];
