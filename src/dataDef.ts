export const ImageDataOptions: StorageDataStateClassProps<ImageDataType> = {
  key: "images",
  src: "/images",
  version: "3.0.2",
  preLoad: false,
  latestField: { time: "desc" },
}

export const charactersDataOptions: StorageDataStateClassProps<CharacterDataType> = {
  key: "characters",
  src: "/characters",
  version: "1.5.0",
  preLoad: false,
  latestField: { id: "desc" },
}

export const postsDataOptions: StorageDataStateClassProps<PostDataType> = {
  key: "posts",
  src: "/posts",
  version: "1.4.0",
  preLoad: false,
  latestField: { time: "desc" },
}

export const soundsDataOptions: StorageDataStateClassProps<SoundDataType> = {
  key: "sounds",
  src: "/sounds",
  version: "1.3.1",
  preLoad: false,
  latestField: { time: "desc" },
}

export const soundAlbumsDataOptions: StorageDataStateClassProps<SoundAlbumDataType> = {
  key: "soundAlbums",
  src: "/soundAlbums",
  version: "1.3.1",
  preLoad: false,
}

export const filesDataOptions: StorageDataStateClassProps<FilesRecordDataType> = {
  key: "files",
  src: "/files",
  version: "1.3.0",
  preLoad: false,
}

export const linksDataOptions: StorageDataStateClassProps<SiteLinkData> = {
  key: "links",
  src: "/links",
  version: "1.0.0",
  preLoad: false,
}

export const linksFavDataOptions: StorageDataStateClassProps<SiteLinkData> = {
  key: "linksFav",
  src: "/links/fav",
  version: "1.0.2",
  preLoad: false,
  oldServerKeys: ["favorite_links"]
}

export const TableVersionDataOptions: StorageDataStateClassProps<TableVersionEntryType> = {
  key: "tables",
  src: "/tables",
  version: "1.0.0",
  idField: "key",
  preLoad: false,
}
