import { GalleryItemType } from "./GalleryType"

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
  enableEmoji?: boolean
  enableRobotsTXT?: boolean
  menu?: {
    nav?: SiteMenuItemType[],
    sns?: SiteSnsItemType[],
  }
  gallery?: {
    default?: GalleryItemType[]
    generate?: GalleryItemType[]
  }
}

export type SiteAuthorType = {
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

export type SiteMenuItemType = {
  name: string
  short?: string
  url?: string
  switch?: "theme"
}

export type SiteSnsItemType = {
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