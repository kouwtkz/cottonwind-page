interface JSONAllDataTypes {
  images: ImageDataType[];
  characters: CharacterDataType[];
  posts: PostDataType[];
  sounds: SoundDataType[];
  soundAlbums: SoundAlbumDataType[];
  files: FilesRecordDataType[];
  links: SiteLinkData[];
  linksFav: SiteLinkData[];
  likeData: LikeDataType[];
  KeyValueDB: KeyValueDBType[];
  redirect: redirectType[];
  tables: Props_LastmodMH_Tables_Data[];
  extRss: ExtRssType[] | null;
}
type JSONAllDataKeys = keyof JSONAllDataTypes;
