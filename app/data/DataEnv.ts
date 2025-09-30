import { concatOriginUrl } from "~/components/functions/originUrl";
import { apiOrigin } from "./ClientDBLoader";

export const INDEXEDDB_NAME = import.meta.env!.VITE_INDEXEDDB_NAME;

const ImageDataName = "images";
export const ImageDataOptions: Props_LastmodMHClass_Options<ImageType, ImageDataType> = {
  name: ImageDataName,
  src: "/images",
  api: "/image",
  version: "3.2.0",
  preLoad: false,
  latestField: { time: "desc" },
  primary: "id",
  secondary: ["key", "time", "lastmod", "album", "type"],
  convert: { date: ["time", "lastmod", "mtime"], array: ["tags", "copyright", "characters"], boolean: ["pickup", "draft"] }
}

const charactersDataName = "characters";
export const charactersDataOptions: Props_LastmodMHClass_Options<CharacterType, CharacterDataType> = {
  name: charactersDataName,
  src: "/characters",
  api: "/character",
  version: "1.5.1",
  preLoad: false,
  latestField: { id: "desc" },
  jsonFromDataOptions: { time: null },
  secondary: ["key", "lastmod"],
  convert: { date: ["lastmod", "time", "birthday"], array: ["tags", "playlist"], boolean: ["draft"] }
}

const postsDataName = "posts";
export const postsDataOptions: Props_LastmodMHClass_Options<PostType, PostDataType> = {
  name: postsDataName,
  src: "/posts",
  api: "/blog",
  version: "1.4.1",
  preLoad: false,
  latestField: { time: "desc" },
  jsonFromDataOptions: { key: "postId" },
  primary: "id",
  secondary: ["postId", "time", "lastmod"],
  convert: { date: ["time", "lastmod"], array: ["category"], boolean: ["draft", "noindex"] }
}

const soundsDataName = "sounds";
export const soundsDataOptions: Props_LastmodMHClass_Options<SoundItemType, SoundDataType> = {
  name: soundsDataName,
  src: "/sounds",
  api: "/sound",
  version: "1.5.0",
  preLoad: false,
  latestField: { time: "desc" },
  jsonFromDataOptions: { time: null },
  secondary: ["key", "lastmod"],
  convert: { date: ["lastmod"], array: ["genre", "grouping"], boolean: ["draft"] }
}

const soundAlbumsDataName = "soundAlbums";
export const soundAlbumsDataOptions: Props_LastmodMHClass_Options<SoundAlbumType, SoundAlbumDataType> = {
  name: soundAlbumsDataName,
  src: "/soundAlbums",
  api: "/sound/album",
  version: "1.3.2",
  preLoad: false,
  secondary: ["key", "lastmod"],
  convert: { date: ["lastmod"], boolean: ["draft"] }
}

const filesDataDataName = "files";
export const filesDataOptions: Props_LastmodMHClass_Options<FilesRecordType, FilesRecordDataType> = {
  name: filesDataDataName,
  src: "/files",
  api: "/file",
  version: "1.3.1",
  preLoad: false,
  secondary: ["key", "lastmod"],
  convert: { date: ["mtime", "lastmod"], boolean: ["private"] }
}

const linksJsonFromDataOptions = { key: ["title", "url", "image"] } as JsonFromDataObjectOptionFields<keyof SiteLinkData>;

const linksDataName = "links";
export const linksDataOptions: Props_LastmodMHClass_Options<SiteLink, SiteLinkData> = {
  name: linksDataName,
  src: "/links",
  api: "/links",
  version: "1.0.1",
  preLoad: false,
  jsonFromDataOptions: linksJsonFromDataOptions,
  primary: "id",
  secondary: ["lastmod", "category"],
  convert: { date: ["lastmod"], boolean: ["draft"] }
}

const linksFavDataName = "linksFav";
export const linksFavDataOptions: Props_LastmodMHClass_Options<SiteLink, SiteLinkData> = {
  name: linksFavDataName,
  src: "/links/fav",
  api: "/links/fav",
  version: "1.0.3",
  preLoad: false,
  oldServerKeys: ["favorite_links"],
  jsonFromDataOptions: linksJsonFromDataOptions,
  primary: "id",
  secondary: ["lastmod", "category"],
  convert: { date: ["lastmod"], boolean: ["draft"] }

}

const likeDataName = "likeData";
export const likeDataOptions: Props_LastmodMHClass_Options<LikeType, LikeDataType> = {
  name: likeDataName,
  src: "/like",
  api: "/like",
  version: "1.0.1",
  preLoad: false,
  primary: "path",
  secondary: ["lastmod"],
  convert: { date: ["lastmod"] }

}

const KeyValueDBDataName = "KeyValueDB";
export const KeyValueDBDataOptions: Props_LastmodMHClass_Options<KeyValueDBType, KeyValueDBDataType> = {
  name: KeyValueDBDataName,
  src: "/kvdb",
  api: "/kvdb",
  version: "1.2.0",
  preLoad: false,
  primary: "key",
  secondary: ["lastmod"],
  convert: { date: ["lastmod"], boolean: ["private"] }
}

const redirectDataName = "redirect";
export const redirectDataOptions: Props_LastmodMHClass_Options<redirectType, redirectDataType> = {
  name: redirectDataName,
  src: "/redirect",
  api: "/redirect",
  version: "1.0.0",
  preLoad: false,
  primary: "id",
  secondary: ["lastmod", "path"],
  convert: { date: ["lastmod"] }
}

const TableVersionDataName = "tables"
export const TableVersionDataOptions: Props_LastmodMHClass_Options<Props_LastmodMH_Tables, Props_LastmodMH_Tables_Data> = {
  name: TableVersionDataName,
  src: "/tables",
  version: "1.0.2",
  primary: "key",
  secondary: ["lastmod"],
  preLoad: false,
  convert: { date: ["lastmod"] }
}

export function GetAPIFromOptions(options: Props_LastmodMHClass_Options<any>, path?: string) {
  const API = ("/" + (options.api || options.name)).replace(/\/+/g, "/");
  return API + (path || "");
}

export type TableNameTypes = typeof ImageDataName | typeof charactersDataName | typeof postsDataName
  | typeof soundsDataName | typeof soundAlbumsDataName | typeof filesDataDataName
  | typeof linksDataName | typeof linksFavDataName | typeof KeyValueDBDataName | typeof redirectDataName | typeof TableVersionDataName;
export type TableNameTypesWithAll = TableNameTypes | "all";
