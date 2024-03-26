import { ResizeMode, ResizeOptionType } from "./MediaImageYamlType";

/** @comments ひとつのアルバムの変数 */
export interface MediaImageAlbumType {
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
  list: MediaImageItemType[];
}

export interface AlbumVisibleType { info?: boolean, title?: boolean, filename?: boolean }
export interface ResizedType { src: string, mode: ResizeMode }

/** @comments ひとつの画像用の定義 */
export interface MediaImageItemBaseType {
  name: string;
  src: string;
  dir?: string;
  path?: string;
  link?: string;
  direct?: string;
  URL?: string;
  tags?: string[];
  description?: string;
  embed?: string;
  copyright?: string;
  timeOptions?: Intl.DateTimeFormatOptions;
  topImage?: boolean | null;
  pickup?: boolean | null;
  tool?: string | string[];
  resizeOption?: ResizeOptionType | ResizeOptionType[];
  resized?: ResizedType[]
  album?: MediaImageAlbumType;
  mtime?: Date;
  origin?: string;
  originName?: string;
  size?: { w: number; h: number }
  type?: string;
  [name: string]: any;
}
export interface MediaImageItemType extends MediaImageItemBaseType {
  time?: Date | null;
}
