export const ImageDataOptions: Props_DataStateOptions<ImageType> = {
  key: "images",
  src: "/images",
  version: 1,
  versionOnServer: 1,
  latestField: { time: "desc" },
  primary: "id",
  secondary: ["key", "time"]
}

export const charactersDataOptions: Props_DataStateOptions<CharacterDataType> = {
  key: "characters",
  src: "/characters",
  version: 1,
  versionOnServer: 1,
  latestField: { id: "desc" },
}

export const postsDataOptions: Props_DataStateOptions<PostDataType> = {
  key: "posts",
  src: "/posts",
  version: 1,
  versionOnServer: 1,
  latestField: { time: "desc" },
}

export const soundsDataOptions: Props_DataStateOptions<SoundDataType> = {
  key: "sounds",
  src: "/sounds",
  version: 1,
  versionOnServer: 1,
  latestField: { time: "desc" },
}

export const soundAlbumsDataOptions: Props_DataStateOptions<SoundAlbumDataType> = {
  key: "soundAlbums",
  src: "/soundAlbums",
  version: 1,
  versionOnServer: 1,
}

export const filesDataOptions: Props_DataStateOptions<FilesRecordDataType> = {
  key: "files",
  src: "/files",
  version: 1,
  versionOnServer: 1,
}

const linksJsonFromDataOptions = { key: ["title", "url", "image"] } as JsonFromDataObjectOptions<keyof SiteLinkData>;

export const linksDataOptions: Props_DataStateOptions<SiteLinkData> = {
  key: "links",
  src: "/links",
  version: 1,
  versionOnServer: 1,
}

export const linksFavDataOptions: Props_DataStateOptions<SiteLinkData> = {
  key: "linksFav",
  src: "/links/fav",
  version: 1,
  versionOnServer: 1,
}

export const likeDataOptions: Props_DataStateOptions<LikeType> = {
  key: "likeData",
  src: "/like",
  version: 1,
  versionOnServer: 1,
}

export const KeyValueDBDataOptions: Props_DataStateOptions<KeyValueDBDataType> = {
  key: "KeyValueDB",
  src: "/kvdb",
  version: 1,
  versionOnServer: 1,
}

export const TableVersionDataOptions: Props_DataStateOptions<TableVersionEntryDataType> = {
  key: "tables",
  src: "/tables",
  version: 1,
  versionOnServer: 1,
}
