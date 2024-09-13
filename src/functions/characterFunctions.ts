export function getCharacterMap(characterData: CharacterDataType[]) {
  const charactersMap = new Map<string, CharacterType>();
  characterData.forEach((v) => {
    const item: CharacterType = {
      ...v,
      media: {},
      tags: v.tags ? v.tags.split(",") : [],
      playlist: v.playlist ? v.playlist.split(",") : [],
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
