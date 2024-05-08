export const RoutingList = [
  "/", "character", "character/:charaName",
  "gallery", "gallery/ebook", "gallery/:group",
  "sound", "about"
] as const;
export type RoutingUnion = typeof RoutingList[number];
