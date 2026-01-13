
type SiteMenuItemType = {
  name: string;
  short?: string;
  url?: string;
  out?: boolean;
  switch?: "theme";
}

interface SiteMyLinksItemEnvType {
  name: string
  url: string
  title?: string
  mask?: string
  image?: string
  row?: number
  rel?: string
  none?: boolean
}
interface SiteMyLinksItemType extends SiteMyLinksItemEnvType {
  key: string;
  hidden?: boolean
}

interface ArrayEnvType {
  readonly NAV?: Array<SiteMenuItemType>;
  readonly LINKS?: Array<SiteMyLinksItemType>;
  readonly IMAGE_ALBUMS?: Array<ImageAlbumEnvType>;
}
