interface SiteLinkData {
  id?: number;
  key?: string;
  url?: string | null;
  title?: string | null;
  description?: string | null;
  image?: string | null;
  category?: string | null;
  style?: string | null;
  order?: number | null;
  draft?: number | null;
  prompt?: string | null;
  password?: string | null;
  lastmod?: string;
}

interface SiteLink extends SiteLinkData, WithRawDataType<SiteLinkData> {
  draft?: boolean;
  Image?: ImageType;
  lastmod?: Date;
}
