import { ISOStringToZonedDateTime } from "./time/DateFunction";

export function getSoundsMap(data: SoundDataType[]) {
  const soundsMap = new Map<string, SoundItemType>();
  data.forEach((v) => {
    const item: SoundItemType = {
      ...v,
      genre: v.genre ? v.genre.split(",") : [],
      grouping: v.grouping ? v.grouping.split(",") : [],
      draft: typeof v.draft === "number" ? Boolean(v.draft) : undefined,
      time: v.time ? ISOStringToZonedDateTime(v.time) : undefined,
      lastmod: v.lastmod ? ISOStringToZonedDateTime(v.lastmod) : undefined,
    };
    const key = item.key;
    if (!soundsMap.has(key)) {
      soundsMap.set(key, item);
    }
  });
  return soundsMap;
}

export function getSoundAlbumsMap(data: SoundAlbumDataType[]) {
  const soundAlbumsMap = new Map<string, SoundAlbumType>();
  data.forEach((v) => {
    const item: SoundAlbumType = {
      ...v,
      setup: typeof v.setup === "number" ? Boolean(v.setup) : undefined,
      draft: typeof v.draft === "number" ? Boolean(v.draft) : undefined,
      time: v.time ? ISOStringToZonedDateTime(v.time) : undefined,
      lastmod: v.lastmod ? ISOStringToZonedDateTime(v.lastmod) : undefined,
    };
    const key = item.key;
    if (!soundAlbumsMap.has(key)) {
      soundAlbumsMap.set(key, item);
    }
  });
  return soundAlbumsMap;
}
