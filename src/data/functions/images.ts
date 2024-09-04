export function parseImageItems(imageAlbums: MediaImageAlbumType[]) {
  const imageList: OldMediaImageItemType[] = [];
  imageAlbums.forEach((album) => {
    album.list.forEach((item) => {
      album.visible = {
        ...{ info: true, filename: true, title: true },
        ...album.visible,
      };
      item.album = album;
      item.time = item.time ? new Date(item.time) : undefined;
      imageList.push(item);
      item.originType = item.type;
      if (!item.type) item.type = AutoImageItemType(item.embed, album.type);
    });
  });
  return imageList;
}

export function getTagList(imageItemList: OldMediaImageItemType[]) {
  return imageItemList
    .reduce((list, c) => {
      c.tags?.forEach((value) => {
        const item = list.find((item) => item.value === value);
        if (item) item.count++;
        else list.push({ value, count: 0 });
      });
      return list;
    }, [] as ValueCountType[])
    .sort((a, b) => (a.value > b.value ? 1 : -1));
}

export function getCopyRightList(imageItemList: OldMediaImageItemType[]) {
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

export function AutoImageItemType(embed?: string, albumType?: string) {
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

export function imageFindFromName
  ({ imageItemList, imageParam, albumParam }:
    { imageItemList?: OldMediaImageItemType[], imageParam: string, albumParam?: string }) {
  const albumItemList = albumParam
    ? imageItemList?.filter(({ album }) => album?.name === albumParam)
    : imageItemList;
  return (
    albumItemList?.find((image) =>
      image.originName?.startsWith(imageParam)
    ) ?? null
  );
}