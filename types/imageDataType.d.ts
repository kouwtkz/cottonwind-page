interface ImageDataType {
  id: number;
  key: string;
  title?: string | null;
  album?: string | null;
  description?: string | null;
  src?: string | null;
  thumbnail?: string | null;
  width?: number | null;
  height?: number | null;
  tags?: string | null;
  characters?: string | null;
  copyright?: string | null;
  link?: string | null;
  embed?: string | null;
  type?: string | null;
  series?: string | null;
  chapter?: number | null;
  order?: number | null;
  topImage?: number | null;
  pickup?: number | null;
  position?: string | null;
  draft?: number | null;
  version?: number | null;
  creationTime?: number | null;
  time?: string;
  mtime?: string;
  lastmod: string;
}
interface ImageIndexedDataType extends Omit<ImageDataType, "tags" | "characters" | "type" | "copyright" | "pickup" | "draft" | "time" | "mtime" | "lastmod">, WithRawExtendDataType<ImageDataType> {
  albumObject?: ImageAlbumType;
  tags?: string[];
  characters?: string[];
  characterNameGuides?: string[];
  type?: imageKindType;
  next?: ImageType;
  previous?: ImageType;
  copyright?: string[];
  direct?: boolean;
  otherTags?: boolean;
  pickup?: boolean | null;
  draft?: boolean;
  wh?: string;
  time?: Date;
  mtime?: Date;
  lastmod?: Date;
  update?: boolean;
  new?: boolean;
  schedule?: boolean;
  hideInfo?: boolean;
}
interface ImageType extends Omit<ImageIndexedDataType, "creationTime">, WithRawExtendDataType<ImageDataType>, ExtendDataProps {
  year?: number;
  like?: LikeType;
  characterObjects?: CharacterType[];
  creationTime?: TimeClass | null;
  checked?: boolean;
  data?: ImageDataType;
}

/** @comments ひとつのアルバムの変数 */
interface ImageAlbumType {
  name: string;
  title?: string;
  description?: string;
  link?: string;
  visible?: AlbumVisibleType;
  type?: string;
  timeFormat?: string;
  timeReplace?: string;
  latest?: boolean;
  gallery?: {
    pages?: GalleryListPropsBase;
    generate?: GalleryListPropsBase;
  };
  list: ImageType[];
}

interface ImageAlbumEnvType extends Omit<ImageAlbumType, "list"> { }

interface ImageAlbumDataType {
  name?: string;
  description?: string;
  list?: ImageDataType;
}

interface imageUpdateJsonDataType extends Omit<ImageType, "width" | "height" | "version" | "lastmod"> {
  rename?: string;
}

type imageModeType = "src" | "thumbnail";
type imageKindType = "illust" | "ebook" | "multi" | "goods" | "movie" | "picture" | "3d" | "material" | "embed" | "pdf" | "other";

/** @comments ひとつのアルバムの変数 */
interface MediaImageAlbumType {
  dir?: string;
  name: string;
  group?: string;
  listup?: boolean;
  link?: string;
  direction?: "ltr" | "rtl";
  time?: Date | null;
  description?: string;
  visible?: AlbumVisibleType;
  type?: string;
  list: ImageType[];
}

interface AlbumVisibleType { info?: boolean, title?: boolean, filename?: boolean }
interface ResizedType { src: string, mode: ResizeMode }


type GroupFormat = "image" | "comic";
type ResizeMode = "icon" | "thumbnail" | "simple";
type FitMethod = "fill" | "contain" | "cover" | "outside" | "inside";

interface GalleryListPropsBase {
  size?: number;
  h2?: string;
  h4?: string;
  label?: string;
  showLabel?: boolean;
  linkLabel?: boolean | string;
  max?: number;
  maxWhenSearch?: number;
  step?: number;
  autoDisable?: boolean;
  tags?: string | string[];
  character?: string;
  list?: ImageType[];
  hide?: boolean;
  hideWhenDefault?: boolean;
  hideWhenFilter?: boolean;
  hideWhenEmpty?: boolean;
  notYearList?: boolean;
}

type YearListType = { year: number; value?: string; label?: string; count: number };

interface GalleryItemObjectType extends GalleryListPropsBase {
  name: string;
  type?: string;
  match?: string | RegExp;
  format?: GroupFormat;
  description?: string;
}

type GalleryItemType = GalleryItemObjectType;

type GalleryItemsType = GalleryItemType | GalleryItemType[];

interface sortObjectType {
  key: string;
  order: "asc" | "desc";
}
