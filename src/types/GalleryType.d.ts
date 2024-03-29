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
  tags?: string | string[];
  list?: MediaImageItemType[];
  hideWhenFilter?: boolean;
  hideWhenEmpty?: boolean;
}

export type YearListType = { year: number; value?: string; label?: string; count: number };

export interface GalleryItemObjectType extends GalleryListPropsBase {
  name?: string;
  match?: string | RegExp;
  format?: GroupFormat;
}

export type GalleryItemType = string | GalleryItemObjectType;

export type GalleryItemsType = GalleryItemType | GalleryItemType[];
