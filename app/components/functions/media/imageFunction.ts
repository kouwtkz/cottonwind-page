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

export function AutoImageItemType(embed?: OrNull<string>, albumType?: OrNull<string>): imageKindType {
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
      return "file" as imageKindType;
    }
  } else if (albumType) {
    return albumType as imageKindType;
  } else {
    return "other";
  }
}
