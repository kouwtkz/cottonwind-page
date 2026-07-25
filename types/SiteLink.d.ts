interface SiteLinkData {
  id?: number;
  key?: string;
  url?: string | null;
  title?: string | null;
  description?: string | null;
  image?: string | null;
  category?: string | null;
  tags?: string | null;
  style?: string | null;
  order?: number | null;
  draft?: number | null;
  prompt?: string | null;
  password?: string | null;
  lastmod?: string;
}

interface SiteLinkIndexedDataType extends Omit<SiteLinkData, "tags">, WithRawExtendDataType<SiteLinkData> {
  draft?: boolean;
  tags?: string[] | null;
}

interface SiteLink extends Omit<SiteLinkIndexedDataType, "lastmod"> {
  lastmod?: Temporal.ZonedDateTime;
  Image?: ImageType;
}
