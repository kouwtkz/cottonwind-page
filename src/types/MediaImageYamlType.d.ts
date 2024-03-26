import { AlbumVisibleType, MediaImageItemBaseType } from "./MediaImageDataType";

export interface MediaImageInYamlType extends MediaImageItemBaseType {
  time?: Date;
  fullPath?: string;
  resizeOptions?: ResizeOptionType[];
}

export type GroupFormat = "image" | "comic";
export type ResizeMode = "icon" | "thumbnail" | "simple";
export type FitMethod = "fill" | "contain" | "cover" | "outside" | "inside";

export interface ResizeOptionType {
  mode?: ResizeMode;
  ext?: string;
  size?: number | {
    w: number;
    h: number;
  };
  quality?: number;
  fit?: FitMethod;
  url?: string;
}

export interface YamlDataType {
  recursive?: boolean;
  listup?: boolean;
  name?: string;
  description?: string;
  visible?: AlbumVisibleType;
  auto?: null | "year"
  copyright?: string;
  format?: GroupFormat;
  type?: string;
  direction?: "ltr" | "rtl";
  time?: string;
  list?: MediaImageInYamlType[];
  notfound?: MediaImageInYamlType[];
  output?: OutputOptionType;
  resizeOption?: ResizeOptionType | ResizeOptionType[];
}

export type YamlGroupType = {
  name: string;
  from: string;
  to?: string;
  dir: string;
  data: YamlDataType;
  list: MediaImageInYamlType[];
  already: boolean;
  mtime?: Date;
};

export type GetYamlImageFilterType = {
  path?: string | RegExp;
  group?: string[] | string | RegExp;
  tags?: string[] | string;
  topImage?: boolean;
  archive?: boolean;
  listup?: boolean;
  endsWith?: boolean;
}

export interface GetYamlImageListBaseProps {
  from: string;
  /**
   * @default path
   * @augments `${publicDir}/${to}`
   */
  to?: string;
  /** @default "public" */
  publicDir?: string;
  selfRoot?: boolean;
  filter?: GetYamlImageFilterType;
  deleteImage?: boolean;
  /** @default false */
  readSize?: boolean;
}

export interface GetYamlImageListProps extends GetYamlImageListBaseProps {
  readImageHandle?: (arg0: readImageHandleProps) => Promise<void>;
  retouchImageHandle?: (arg0: retouchImageHandleProps) => Promise<void>;
}

export interface UpdateImageYamlProps extends GetYamlImageListBaseProps {
  yamls?: YamlGroupType[];
  retouchImageHandle?: (arg0: retouchImageHandleProps) => Promise<void>;
}

export type OutputOptionType = {
  get?: boolean; // Jsonとかで使うかどうか
  webp?: boolean;
  time?: boolean;
  info?: boolean;
}

export interface readImageHandleProps {
  yamls: YamlGroupType[];
  readSize?: boolean;
  resizedDir?: string;
  retouchImageHandle?: (arg0: retouchImageHandleProps) => Promise<void>;
  deleteImage?: boolean;
}

export interface retouchImageHandleProps {
  yamls: YamlGroupType[];
  publicDir?: string;
  deleteImage?: boolean;
  selfRoot?: boolean;
}
