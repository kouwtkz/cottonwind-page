type SiteDataType = {
  title: string
  description: string
  short: { description: string }
  url: string
  pagesUrl?: string
  wavebox?: string
  image: string
  author: SiteAuthorType
  manifest: any
  feedFrom?: string
  feedDev?: string
  enableEmoji?: boolean
  menu?: {
    nav?: SiteMenuItemType[],
    sns?: SiteSnsItemType[],
  }
  gallery?: {
    default?: GalleryItemType[]
    generate?: GalleryItemType[]
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
  name: string
  short?: string
  url?: string
  switch?: "theme"
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