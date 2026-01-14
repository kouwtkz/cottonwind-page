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
  convert: { date: ["time", "lastmod", "mtime"], array: ["tags", "copyright", "characters"], boolean: ["pickup", "draft"] },
  createEntry: {
    id: { primary: true },
    key: { type: "TEXT", unique: true, notNull: true },
    title: { type: "TEXT" },
    album: { type: "TEXT" },
    description: { type: "TEXT" },
    src: { type: "TEXT" },
    thumbnail: { type: "TEXT" },
    width: { type: "INTEGER" },
    height: { type: "INTEGER" },
    tags: { type: "TEXT" },
    characters: { type: "TEXT" },
    copyright: { type: "TEXT" },
    link: { type: "TEXT" },
    embed: { type: "TEXT" },
    type: { type: "TEXT" },
    order: { type: "INTEGER" },
    topImage: { type: "INTEGER" },
    pickup: { type: "INTEGER" },
    position: { type: "TEXT" },
    draft: { type: "INTEGER" },
    time: { type: "TEXT", index: true },
    mtime: { type: "TEXT" },
    lastmod: { createAt: true, unique: true },
    version: { type: "INTEGER" },
  },
  insertEntryKeys: ["key", "title", "album", "description", "src", "thumbnail", "width", "height",
    "tags", "characters", "copyright", "link", "embed", "type", "order", "topImage", "pickup", "draft", "version"],
  insertEntryTimes: ["time", "mtime", "lastmod"]
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
  convert: { date: ["lastmod", "time", "birthday"], array: ["tags", "playlist"], boolean: ["draft"] },
  createEntry: {
    id: { primary: true },
    key: { type: "TEXT", unique: true, notNull: true },
    name: { type: "TEXT" },
    enName: { type: "TEXT" },
    honorific: { type: "TEXT" },
    nameGuide: { type: "TEXT" },
    defEmoji: { type: "TEXT" },
    overview: { type: "TEXT" },
    description: { type: "TEXT" },
    tags: { type: "TEXT" },
    order: { type: "INTEGER" },
    draft: { type: "INTEGER" },
    playlist: { type: "TEXT" },
    icon: { type: "TEXT" },
    image: { type: "TEXT" },
    headerImage: { type: "TEXT" },
    embed: { type: "TEXT" },
    birthday: { type: "TEXT" },
    time: { type: "TEXT" },
    lastmod: { createAt: true, unique: true },
  },
  insertEntryKeys: ["key", "name", "enName", "nameGuide", "honorific", "defEmoji", "overview", "description", "tags", "order", "draft", "playlist", "icon", "headerImage", "image"],
  insertEntryTimes: ["time", "birthday", "lastmod"]
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
  convert: { date: ["time", "lastmod"], array: ["category"], boolean: ["draft", "noindex"] },
  createEntry: {
    id: { primary: true },
    postId: { type: "TEXT", unique: true, notNull: true },
    title: { type: "TEXT" },
    body: { type: "TEXT" },
    category: { type: "TEXT" },
    pin: { type: "INTEGER" },
    noindex: { type: "INTEGER" },
    draft: { type: "INTEGER" },
    memo: { type: "INTEGER" },
    time: { createAt: true, index: true },
    lastmod: { createAt: true, unique: true },
  },
  insertEntryKeys: ["postId", "title", "body", "category", "pin", "draft", "noindex", "memo"],
  insertEntryTimes: ["time", "lastmod"]
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
  convert: { date: ["lastmod"], array: ["genre", "grouping"], boolean: ["draft"] },
  createEntry: {
    id: { primary: true },
    key: { type: "TEXT", unique: true, notNull: true },
    src: { type: "TEXT" },
    track: { type: "INTEGER" },
    title: { type: "TEXT" },
    description: { type: "TEXT" },
    album: { type: "TEXT" },
    cover: { type: "TEXT" },
    artist: { type: "TEXT" },
    composer: { type: "TEXT" },
    grouping: { type: "TEXT" },
    genre: { type: "TEXT" },
    draft: { type: "INTEGER" },
    time: { createAt: true, index: true },
    mtime: { type: "TEXT" },
    lastmod: { createAt: true, unique: true },
  },
  insertEntryKeys: ["key", "src", "track", "title", "description", "album", "cover", "artist", "composer", "grouping", "genre", "draft"],
  insertEntryTimes: ["time", "mtime", "lastmod"]
}

const soundAlbumsDataName = "soundAlbums";
export const soundAlbumsDataOptions: Props_LastmodMHClass_Options<SoundAlbumType, SoundAlbumDataType> = {
  name: soundAlbumsDataName,
  src: "/soundAlbums",
  api: "/sound/album",
  version: "1.3.2",
  preLoad: false,
  secondary: ["key", "lastmod"],
  convert: { date: ["lastmod"], boolean: ["draft"] },
  createEntry: {
    id: { primary: true },
    key: { type: "TEXT", unique: true, notNull: true },
    title: { type: "TEXT" },
    description: { type: "TEXT" },
    cover: { type: "TEXT" },
    artist: { type: "TEXT" },
    order: { type: "TEXT" },
    category: { type: "TEXT" },
    setup: { type: "INTEGER" },
    draft: { type: "INTEGER" },
    time: { createAt: true, index: true },
    lastmod: { createAt: true, unique: true },
  },
  insertEntryKeys: ["key", "title", "description", "cover", "artist", "order", "category", "setup", "draft"],
  insertEntryTimes: ["time", "lastmod"]
}

const filesDataDataName = "files";
export const filesDefaultDir = import.meta.env.VITE_FILES_DEFAULT_DIR;
export const filesDataOptions: Props_LastmodMHClass_Options<FilesRecordType, FilesRecordDataType> = {
  name: filesDataDataName,
  src: "/files",
  api: "/file",
  version: "1.3.1",
  preLoad: false,
  secondary: ["key", "lastmod"],
  convert: { date: ["mtime", "lastmod"], boolean: ["private"] },
  createEntry: {
    id: { primary: true },
    key: { type: "TEXT", unique: true, notNull: true },
    src: { type: "TEXT" },
    private: { type: "INTEGER" },
    mtime: { type: "TEXT" },
    lastmod: { createAt: true, unique: true },
  },
  insertEntryKeys: ["key", "src", "private"],
  insertEntryTimes: ["mtime", "lastmod"]
}

const linksJsonFromDataOptions = { key: ["title", "url", "image"] } as JsonFromDataObjectOptionFields<keyof SiteLinkData>;

const linksDataName = "links";
export const linksDataOptions: Props_LastmodMHClass_Options<SiteLink, SiteLinkData> = {
  name: linksDataName,
  src: "/links",
  api: "/links",
  version: "1.2.1",
  preLoad: false,
  jsonFromDataOptions: linksJsonFromDataOptions,
  primary: "id",
  secondary: ["lastmod", "category", "key"],
  convert: { date: ["lastmod"], boolean: ["draft"] },
  createEntry: {
    id: { primary: true },
    key: { type: "TEXT" },
    url: { type: "TEXT" },
    title: { type: "TEXT" },
    description: { type: "TEXT" },
    image: { type: "TEXT" },
    category: { type: "TEXT" },
    draft: { type: "INTEGER" },
    order: { type: "INTEGER" },
    prompt: { type: "TEXT" },
    password: { type: "TEXT" },
    lastmod: { createAt: true, unique: true },
  },
  insertEntryKeys: ["url", "key", "title", "description", "image", "category", "order", "draft", "prompt", "password"],
  insertEntryTimes: ["lastmod"]
}

const linksFavDataName = "linksFav";
export const linksFavDataOptions: Props_LastmodMHClass_Options<SiteLink, SiteLinkData> = {
  ...linksDataOptions,
  name: linksFavDataName,
  src: "/links/fav",
  api: "/links/fav",
  oldServerKeys: ["favorite_links"],
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
  convert: { date: ["lastmod"] },
  createEntry: {
    path: { primary: true, type: "TEXT" },
    count: { default: 0, notNull: true },
    registed: { type: "TEXT", notNull: true },
    lastmod: { createAt: true, unique: true },
  },
  insertEntryKeys: ["path", "count", "registed"],
  insertEntryTimes: ["lastmod"]
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
  convert: { date: ["lastmod"], boolean: ["private"] },
  createEntry: {
    key: { primary: true, type: "TEXT" },
    value: { type: "TEXT" },
    private: { type: "NUMERIC" },
    lastmod: { createAt: true, unique: true },
  },
  insertEntryKeys: ["key", "value", "private"],
  insertEntryTimes: ["lastmod"]
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
  convert: { date: ["lastmod"] },
  createEntry: {
    id: { primary: true },
    path: { type: "TEXT", unique: true, notNull: true },
    redirect: { type: "TEXT" },
    private: { type: "NUMERIC" },
    lastmod: { createAt: true, unique: true },
  },
  insertEntryKeys: ["path", "redirect", "private"],
  insertEntryTimes: ["lastmod"]
}

const TableVersionDataName = "tables"
export const TableVersionDataOptions: Props_LastmodMHClass_Options<Props_LastmodMH_Tables, Props_LastmodMH_Tables_Data> = {
  name: TableVersionDataName,
  src: "/tables",
  version: "1.0.2",
  primary: "key",
  secondary: ["lastmod"],
  preLoad: false,
  convert: { date: ["lastmod"] },
  createEntry: {
    key: { primary: true, type: "TEXT" },
    version: { type: "TEXT" },
    lastmod: { createAt: true, unique: true },
  },
  insertEntryKeys: ["key", "version"],
  insertEntryTimes: ["lastmod"],
}

export function GetAPIFromOptions(options: Props_LastmodMHClass_Options<any>, path?: string) {
  const API = ("/" + (options.api || options.name)).replace(/\/+/g, "/");
  return API + (path || "");
}

export type TableNameTypes = typeof ImageDataName | typeof charactersDataName | typeof postsDataName
  | typeof soundsDataName | typeof soundAlbumsDataName | typeof filesDataDataName
  | typeof linksDataName | typeof linksFavDataName | typeof KeyValueDBDataName | typeof redirectDataName | typeof TableVersionDataName;
export type TableNameTypesWithAll = TableNameTypes | "all";
