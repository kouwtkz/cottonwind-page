export function getImageObjectMap(imagesData: ImageDataType[], imageAlbumEnv?: ImageAlbumEnvType[]) {
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
  const imagesMap = new Map<string, ImageType>();
  imagesData
    .filter((v) => v.version)
    .forEach((v) => {
      if (v.album && !imageAlbumMap.has(v.album)) imageAlbumMap.set(v.album, { name: v.album, list: [] });
      const albumObject = v.album ? imageAlbumMap.get(v.album) : undefined;
      const item: ImageType = {
        ...toImageType(v),
        albumObject,
      };
      if (!imagesMap.has(item.key)) {
        albumObject?.list.push(item);
        imagesMap.set(item.key, item);
      }
    });
  return { imagesMap, imageAlbumMap }
}

export function toImageType(data: ImageDataType): ImageType {
  return {
    ...data,
    tags: data.tags?.split(","),
    characters: data.characters?.split(","),
    copyright: data.copyright?.split(","),
    topImage:
      typeof data.topImage === "number" ? Boolean(data.topImage) : undefined,
    pickup:
      typeof data.pickup === "number" ? Boolean(data.pickup) : undefined,
    draft:
      typeof data.draft === "number" ? Boolean(data.draft) : undefined,
    time: data.time ? new Date(data.time) : undefined,
    mtime: data.mtime ? new Date(data.mtime) : undefined,
    lastmod: data.lastmod ? new Date(data.lastmod) : undefined,
    update: undefined,
    new: undefined,
  };
}

export function getCopyRightList(imageItemList: ImageType[]) {
  return imageItemList
    .reduce((list, { copyright: values }) => {
      values?.forEach((value) => {
        if (value) {
          const item = list.find((item) => item.value === value);
          if (item) item.count++;
          else list.push({ value, count: 0 });
        }
      })
      return list;
    }, [] as ValueCountType[])
    .sort((a, b) => (a.value > b.value ? 1 : -1));
}

export function AutoImageItemType(embed?: OrNull<string>, albumType?: OrNull<string>) {
  if (embed) {
    if (/\.(epub)$/i.test(embed)) {
      return "ebook";
    } else if (/\.(pdf)$/i.test(embed)) {
      return "pdf";
    } else if (/^3d\//i.test(embed)) {
      return "3d";
    } else {
      return "embed";
    }
  } else if (albumType) {
    return albumType;
  } else {
    return "illust";
  }
}
