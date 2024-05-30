export const RoutingList = [
  "/", "character", "character/:charaName",
  "gallery", "gallery/ebook", "gallery/:group",
  "sound", "about", "link"
] as const;
export type RoutingUnion = typeof RoutingList[number];
