export const RoutingList = [
  "/", "character", "character/:charaName",
  "gallery", "gallery/ebook", "gallery/:group",
  "sound", "about", "links",
  "works", "contact",
  "suggest", "blog", "blog/post"
] as const;
export type RoutingUnion = typeof RoutingList[number];
