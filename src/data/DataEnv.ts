export const INDEXEDDB_NAME = import.meta.env!.VITE_INDEXEDDB_NAME;
export const INDEXEDDB_VERSION: number = 1;

export const ImageDataOptions: DataClassProps<ImageType, ImageDataType> = {
  key: "images",
  src: "/images",
  version: "3.2.0",
  preLoad: false,
  latestField: { time: "desc" },
  primary: "id",
  secondary: ["key", "time", "lastmod", "album", "type"],
  convert: { date: ["time", "lastmod", "mtime"], array: ["tags", "copyright", "characters"], boolean: ["draft"] }
}

export const charactersDataOptions: DataClassProps<CharacterType, CharacterDataType> = {
  key: "characters",
  src: "/characters",
  version: "1.5.1",
  preLoad: false,
  latestField: { id: "desc" },
  jsonFromDataOptions: { time: null },
  secondary: ["key", "lastmod"],
  convert: { date: ["lastmod", "time", "birthday"], array: ["tags", "playlist"], boolean: ["draft"] }
}

export const postsDataOptions: DataClassProps<PostType, PostDataType> = {
  key: "posts",
  src: "/posts",
  version: "1.4.1",
  preLoad: false,
  latestField: { time: "desc" },
  jsonFromDataOptions: { key: "postId" },
  primary: "id",
  secondary: ["postId", "time", "lastmod"],
  convert: { date: ["time", "lastmod"], array: ["category"], boolean: ["draft", "noindex"] }
}

export const soundsDataOptions: DataClassProps<SoundItemType, SoundDataType> = {
  key: "sounds",
  src: "/sounds",
  version: "1.3.2",
  preLoad: false,
  latestField: { time: "desc" },
  jsonFromDataOptions: { time: null },
  secondary: ["key", "lastmod"],
  convert: { date: ["lastmod"], array: ["genre", "grouping"], boolean: ["draft"] }
}

export const soundAlbumsDataOptions: DataClassProps<SoundAlbumType, SoundAlbumDataType> = {
  key: "soundAlbums",
  src: "/soundAlbums",
  version: "1.3.2",
  preLoad: false,
  secondary: ["key", "lastmod"],
  convert: { date: ["lastmod"], boolean: ["draft"] }
}

export const filesDataOptions: DataClassProps<FilesRecordType, FilesRecordDataType> = {
  key: "files",
  src: "/files",
  version: "1.3.1",
  preLoad: false,
  secondary: ["key", "lastmod"],
  convert: { date: ["mtime", "lastmod"], boolean: ["private"] }
}

const linksJsonFromDataOptions = { key: ["title", "url", "image"] } as JsonFromDataObjectOptionFields<keyof SiteLinkData>;

export const linksDataOptions: DataClassProps<SiteLink, SiteLinkData> = {
  key: "links",
  src: "/links",
  version: "1.0.1",
  preLoad: false,
  jsonFromDataOptions: linksJsonFromDataOptions,
  primary: "id",
  secondary: ["lastmod", "category"],
  convert: { date: ["lastmod"], boolean: ["draft"] }
}

export const linksFavDataOptions: DataClassProps<SiteLink, SiteLinkData> = {
  key: "linksFav",
  src: "/links/fav",
  version: "1.0.3",
  preLoad: false,
  oldServerKeys: ["favorite_links"],
  jsonFromDataOptions: linksJsonFromDataOptions,
  primary: "id",
  secondary: ["lastmod", "category"],
  convert: { date: ["lastmod"], boolean: ["draft"] }

}

export const likeDataOptions: DataClassProps<LikeType, LikeDataType> = {
  key: "likeData",
  src: "/like",
  version: "1.0.1",
  preLoad: false,
  primary: "path",
  secondary: ["lastmod"],
  convert: { date: ["lastmod"] }

}

export const KeyValueDBDataOptions: DataClassProps<KeyValueDBType, KeyValueDBDataType> = {
  key: "KeyValueDB",
  src: "/kvdb",
  version: "1.2.0",
  preLoad: false,
  primary: "key",
  secondary: ["lastmod"],
  convert: { date: ["lastmod"], boolean: ["private"] }
}

export const TableVersionDataOptions: DataClassProps<TableVersionEntryType, TableVersionEntryDataType> = {
  key: "tables",
  src: "/tables",
  version: "1.0.1",
  primary: "key",
  secondary: ["lastmod"],
  preLoad: false,
  convert: { date: ["lastmod"] }
}
