import { ISOStringToZonedDateTime } from "./time/DateFunction";

export function getCharacterMap(data: CharacterDataType[]) {
  const charactersMap = new Map<string, CharacterType>();
  data.forEach((v) => {
    if (!v.name) return;
    const { icon, image, headerImage, ..._v } = v;
    const item: CharacterType = {
      ..._v,
      tags: v.tags ? v.tags.split(",") : [],
      playlist: v.playlist ? v.playlist.split(",") : [],
      draft: typeof v.draft === "number" ? Boolean(v.draft) : undefined,
      birthday: v.birthday ? ISOStringToZonedDateTime(v.birthday) : undefined,
      time: v.time ? ISOStringToZonedDateTime(v.time) : undefined,
      lastmod: v.lastmod ? ISOStringToZonedDateTime(v.lastmod) : undefined,
    };
    const key = item.key;
    if (!charactersMap.has(key)) {
      charactersMap.set(key, item);
    }
  });
  return charactersMap;
}
