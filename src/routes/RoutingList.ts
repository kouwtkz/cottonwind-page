export const RoutingList = [
  "/", "character", "character/:charaName",
  "gallery", "gallery/:group",
  "sound", "about", "log", "links",
  "works", "contact", "blog", "blog/post",
  "admin", "admin/:key", "suggest",
] as const;
export type RoutingUnion = typeof RoutingList[number];
