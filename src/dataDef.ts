export const ImageDataOptions: StorageDataStateClassProps<ImageDataType> = {
  key: "images",
  src: "/data/images",
  version: "3.0.2",
  preLoad: false,
  latestField: { time: "desc" },
}

export const charactersDataOptions: StorageDataStateClassProps<CharacterDataType> = {
  key: "characters",
  src: "/data/characters",
  version: "1.5.0",
  preLoad: false,
  latestField: { id: "desc" },
}

export const postsDataOptions: StorageDataStateClassProps<PostDataType> = {
  key: "posts",
  src: "/data/posts",
  version: "1.4.0",
  preLoad: false,
  latestField: { time: "desc" },
}

export const soundsDataOptions: StorageDataStateClassProps<SoundDataType> = {
  key: "sounds",
  src: "/data/sounds",
  version: "1.3.1",
  preLoad: false,
  latestField: { time: "desc" },
}

export const soundAlbumsDataOptions: StorageDataStateClassProps<SoundAlbumDataType> = {
  key: "soundAlbums",
  src: "/data/soundAlbums",
  version: "1.3.1",
  preLoad: false,
}

export const filesDataOptions: StorageDataStateClassProps<FilesRecordDataType> = {
  key: "files",
  src: "/data/files",
  version: "1.3.0",
  preLoad: false,
}

export const linksDataOptions: StorageDataStateClassProps<SiteLinkData> = {
  key: "links",
  src: "/data/links",
  version: "1.0.0",
  preLoad: false,
}

export const favLinksDataOptions: StorageDataStateClassProps<SiteLinkData> = {
  key: "linksFav",
  src: "/data/links/fav",
  version: "1.0.2",
  preLoad: false,
  oldServerKeys: ["favorite_links"]
}
