import { getCountList } from "../arrayFunction";

export function getImageAlbumMap(imageAlbumEnv?: ImageAlbumEnvType[], albums?: string[]) {
  const imageAlbumMap = new Map<string, ImageAlbumType>();
  imageAlbumEnv?.forEach((album) => {
    if (album.name && !imageAlbumMap.has(album.name)) {
      imageAlbumMap.set(album.name, {
        visible: { filename: true, info: true, title: true },
        ...album,
        list: [],
      });
    }
  });
  if (albums) albums.forEach(album => {
    if (!imageAlbumMap.has(album)) imageAlbumMap.set(album, { name: album, list: [] });
  })
  return imageAlbumMap;
}

export function getImageObjectMap(imagesData: ImageDataType[], imageAlbumEnv?: ImageAlbumEnvType[]) {
  const imageAlbumMap = getImageAlbumMap(imageAlbumEnv);
  const imagesMap = new Map<string, ImageType>();
  imagesData
    .filter((v) => v.version && v.src)
    .forEach((v) => {
      if (v.album && !imageAlbumMap.has(v.album)) imageAlbumMap.set(v.album, { name: v.album, list: [] });
      const albumObject = v.album ? imageAlbumMap.get(v.album) : undefined;
      const item: ImageType = {
        ...toImageType(v, imageAlbumMap),
        albumObject,
      };
      if (!imagesMap.has(item.key)) {
        albumObject?.list.push(item);
        imagesMap.set(item.key, item);
      }
    });
  return { imagesMap, imageAlbumMap }
}

export function toImageType(data: ImageDataType, albumsMap?: Map<string, ImageAlbumType>): ImageType {
  const albumObject = data.album && albumsMap ? albumsMap.get(data.album) : undefined;
  const lastmod = data.lastmod ? new Date(data.lastmod) : undefined;
  return {
    ...data,
    type: data.type ? data.type : AutoImageItemType(data.embed, albumObject?.type),
    albumObject,
    tags: data.tags?.split(","),
    characters: data.characters?.split(","),
    copyright: data.copyright?.split(","),
    pickup:
      typeof data.pickup === "number" ? Boolean(data.pickup) : undefined,
    draft:
      typeof data.draft === "number" ? Boolean(data.draft) : undefined,
    wh: `${data.width}x${data.height}`,
    time: data.time ? new Date(data.time) : undefined,
    mtime: data.mtime ? new Date(data.mtime) : undefined,
    lastmod,
    update: undefined,
    new: undefined,
    schedule: lastmod && lastmod.getTime() > Date.now(),
    data
  };
}

export function AutoImageItemType(embed?: OrNull<string>, albumType?: OrNull<string>) {
  if (embed) {
    if (/\.(epub)$/i.test(embed)) {
      return "ebook";
    } else if (/\.(pdf)$/i.test(embed)) {
      return "pdf";
    } else if (/\.(html?|xml)/i.test(embed)) {
      if (/3d/i.test(embed)) return "3d";
      else return "embed";
    } else if (/素材|そざい|material/i.test(embed)) {
      return "material";
    } else {
      return "file";
    }
  } else if (albumType) {
    return albumType;
  } else {
    return "illust";
  }
}
