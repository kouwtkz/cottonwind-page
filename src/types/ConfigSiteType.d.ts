interface SiteConfigListType {
  nav: Array<SiteMenuItemType>;
  sns: Array<SiteSnsItemType>;
  gallery: {
    list: Array<GalleryItemType>;
    generate: Array<GalleryItemObjectType>;
  }
}

type ServerDataType = {
  discordInvite?: string;
  discordInvitePassword?: string;
}

type SiteAuthorType = {
  name: string
  account: string
  ename: string
  mail: string
  smail: string
  since: number
  x:
  {
    [name: string]: string
  }
}

type SiteMenuItemType = {
  name: string;
  short?: string;
  url?: string;
  out?: boolean;
  switch?: "theme";
}

type SiteSnsItemType = {
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