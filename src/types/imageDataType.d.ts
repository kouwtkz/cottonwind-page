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
interface ImageType extends ImageDataType, WithRawDataType<ImageDataType> {
  albumObject?: ImageAlbumType;
  tags?: string[];
  characters?: string[];
  characterObjects?: CharacterType[];
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
  like?: LikeType;
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
