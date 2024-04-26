export const RoutingList = [
  "/", "character", "character/:name",
  "gallery", "gallery/ebook", "gallery/:group",
  "sound", "info", "suggest"
] as const;
export type RoutingUnion = typeof RoutingList[number];
