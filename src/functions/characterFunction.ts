export function getCharacterMap(data: CharacterDataType[]) {
  const charactersMap = new Map<string, CharacterType>();
  data.forEach((v) => {
    const item: CharacterType = {
      ...v,
      media: {},
      tags: v.tags ? v.tags.split(",") : [],
      playlist: v.playlist ? v.playlist.split(",") : [],
      draft: typeof v.draft === "number" ? Boolean(v.draft) : undefined,
      birthday: v.birthday ? new Date(v.birthday) : undefined,
      time: v.time ? new Date(v.time) : undefined,
      lastmod: v.lastmod ? new Date(v.lastmod) : undefined,
    };
    const key = item.key;
    if (!charactersMap.has(key)) {
      charactersMap.set(key, item);
    }
  });
  return charactersMap;
}
