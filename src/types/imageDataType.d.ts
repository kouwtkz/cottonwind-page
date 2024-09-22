interface ImageDataType {
  id: number;
  key: string;
  name?: string | null;
  album?: string | null;
  description?: string | null;
  src?: string | null;
  webp?: string | null;
  thumbnail?: string | null;
  icon?: string | null;
  width?: number | null;
  height?: number | null;
  tags?: string | null;
  characters?: string | null;
  copyright?: string | null;
  link?: string | null;
  embed?: string | null;
  type?: string | null;
  topImage?: number | null;
  pickup?: number | null;
  draft?: number | null;
  version?: number | null;
  time?: string;
  mtime?: string;
  lastmod: string;
}
interface ImageType extends ImageDataType {
  albumObject?: ImageAlbumType;
  tags?: string[];
  characters?: string[];
  copyright?: string[];
  direct?: boolean;
  otherTags?: boolean;
  topImage?: boolean;
  pickup?: boolean;
  draft?: boolean;
  time?: Date;
  mtime?: Date;
  lastmod?: Date;
  Src?: string;
  update?: boolean;
  new?: boolean;
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

type imageModeType = "src" | "webp" | "thumbnail" | "icon";
