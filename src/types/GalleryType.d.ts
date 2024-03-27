import { MediaImageAlbumType, MediaImageItemType } from "./MediaImageDataType";
import { GroupFormat } from "./MediaImageYamlType";

export interface GalleryListPropsBase {
  size?: number;
  h2?: string;
  h4?: string;
  label?: string;
  showLabel?: boolean;
  linkLabel?: boolean | string;
  max?: number;
  step?: number;
  autoDisable?: boolean;
  filterButton?: boolean;
  tags?: string | string[];
  list?: MediaImageItemType[]
  yearList?: YearListType[];
  hideWhenFilter?: boolean;
}

export type YearListType = { year: string; count: number };

interface GalleryListProps extends GalleryListPropsBase {
  album: MediaImageAlbumType | null;
  loading?: boolean;
}

export interface GalleryItemObjectType extends GalleryListPropsBase {
  name?: string;
  match?: string | RegExp;
  format?: GroupFormat;
}

export type GalleryItemType = string | GalleryItemObjectType;

export type GalleryItemsType = GalleryItemType | GalleryItemType[];

interface GalleryItemProps extends GalleryListPropsBase {
  item: GalleryItemObjectType;
}
