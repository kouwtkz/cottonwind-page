interface MediaImageInYamlType extends MediaImageItemType {
  fullPath?: string;
  resizeOptions?: ResizeOptionType[];
}

type GroupFormat = "image" | "comic";
type ResizeMode = "icon" | "thumbnail" | "simple";
type FitMethod = "fill" | "contain" | "cover" | "outside" | "inside";

interface ResizeOptionType {
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

interface YamlDataType {
  recursive?: boolean;
  listup?: boolean;
  name?: string;
  description?: string;
  visible?: AlbumVisibleType;
  auto?: null | "year"
  copyright?: string[];
  format?: GroupFormat;
  type?: string;
  direction?: "ltr" | "rtl";
  time?: string;
  list?: MediaImageInYamlType[];
  notfound?: MediaImageInYamlType[];
  output?: OutputOptionType;
  resizeOption?: ResizeOptionType | ResizeOptionType[];
}

type YamlGroupType = {
  name: string;
  from: string;
  to?: string;
  dir: string;
  data: YamlDataType;
  list: MediaImageInYamlType[];
  already: boolean;
  mtime?: Date;
};

type GetYamlImageFilterType = {
  path?: string | RegExp;
  group?: string[] | string | RegExp;
  tags?: string[] | string;
  topImage?: boolean;
  archive?: boolean;
  listup?: boolean;
  endsWith?: boolean;
}

interface GetYamlImageListBaseProps {
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

interface GetYamlImageListProps extends GetYamlImageListBaseProps {
  readImageHandle?: (arg0: readImageHandleProps) => Promise<void>;
  retouchImageHandle?: (arg0: retouchImageHandleProps) => Promise<void>;
}

interface UpdateImageYamlProps extends GetYamlImageListBaseProps {
  yamls?: YamlGroupType[];
  retouchImageHandle?: (arg0: retouchImageHandleProps) => Promise<void>;
}

type OutputOptionType = {
  get?: boolean; // Jsonとかで使うかどうか
  webp?: boolean;
  time?: boolean;
  info?: boolean;
}

interface readImageHandleProps {
  yamls: YamlGroupType[];
  readSize?: boolean;
  resizedDir?: string;
  retouchImageHandle?: (arg0: retouchImageHandleProps) => Promise<void>;
  deleteImage?: boolean;
}

interface retouchImageHandleProps {
  yamls: YamlGroupType[];
  publicDir?: string;
  deleteImage?: boolean;
  selfRoot?: boolean;
}
