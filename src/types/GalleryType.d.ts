interface GalleryListPropsBase {
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

type YearListType = { year: number; value?: string; label?: string; count: number };

interface GalleryItemObjectType extends GalleryListPropsBase {
  name: string;
  match?: string | RegExp;
  format?: GroupFormat;
  description?: string;
}

type GalleryItemType = string | GalleryItemObjectType;

type GalleryItemsType = GalleryItemType | GalleryItemType[];
