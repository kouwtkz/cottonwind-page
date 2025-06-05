
type SiteMenuItemType = {
  name: string;
  short?: string;
  url?: string;
  out?: boolean;
  switch?: "theme";
}

type SiteMyLinksItemType = {
  key: string;
  name: string
  url: string
  title?: string
  mask?: string
  image?: string
  row?: number
  rel?: string
  hidden?: boolean
  none?: boolean
}

interface ArrayEnvType {
  NAV?: Array<SiteMenuItemType>;
  LINKS?: Array<SiteMyLinksItemType>;
  IMAGE_ALBUMS?: Array<ImageAlbumEnvType>;
}
