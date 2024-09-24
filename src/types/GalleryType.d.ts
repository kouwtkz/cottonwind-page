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
  fList: ImageType[][];
  yfList: ImageType[][];
  setItems: (items: GalleryItemObjectType[]) => void;
  setYFList: (
    fList: ImageType[][],
    yfList: ImageType[][]
  ) => void;
}

interface GalleryBodyOptions extends SearchAreaOptionsProps {
  showInPageMenu?: boolean;
  showGalleryHeader?: boolean;
  showGalleryLabel?: boolean;
  showCount?: boolean;
}

interface GalleryObjectProps extends GalleryBodyOptions {
  items: GalleryItemObjectType[];
}

interface GalleryObjectConvertProps extends GalleryListPropsBase, SearchAreaOptionsProps {
  items?: GalleryItemsType;
}
