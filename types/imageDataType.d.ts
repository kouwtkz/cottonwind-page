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
  order?: number | null;
  topImage?: number | null;
  pickup?: number | null;
  position?: string | null;
  draft?: number | null;
  version?: number | null;
  time?: string;
  mtime?: string;
  lastmod: string;
}
interface ImageType extends Omit<ImageDataType, "tags" | "characters" | "copyright" | "pickup" | "draft" | "time" | "mtime" | "lastmod">, WithRawDataType<ImageDataType> {
  albumObject?: ImageAlbumType;
  tags?: string[];
  characters?: string[];
  // characterObjects?: CharacterType[];
  characterNameGuides?: string[];
  copyright?: string[];
  direct?: boolean;
  otherTags?: boolean;
  pickup?: boolean;
  draft?: boolean;
  wh?: string;
  time?: Date;
  mtime?: Date;
  lastmod?: Date;
  update?: boolean;
  new?: boolean;
  schedule?: boolean;
  // like?: LikeType;
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

interface ImageAlbumDataType {
  name?: string;
  description?: string;
  list?: ImageDataType;
}

interface imageUpdateJsonDataType extends Omit<ImageType, "width" | "height" | "version" | "lastmod"> {
  rename?: string;
}

type imageModeType = "src" | "thumbnail";

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

interface GalleryObjectType {
  items: GalleryItemObjectType[];
  filteredGroups: GalleryItemObjectType[];
  filteredYearGroups: GalleryItemObjectType[];
  images: ImageType[];
}

interface GalleryBodyOptions extends SearchAreaOptionsProps {
  showInPageMenu?: boolean;
  showGalleryHeader?: boolean;
  showGalleryLabel?: boolean;
  showCount?: boolean;
  hideWhenEmpty?: boolean;
}

interface GalleryObjectProps extends GalleryBodyOptions {
  items: GalleryItemObjectType[];
}

interface GalleryObjectConvertProps extends GalleryListPropsBase, SearchAreaOptionsProps {
  items?: GalleryItemsType;
}

type MonthSearchModeType = "event" | "tag" | "time";
