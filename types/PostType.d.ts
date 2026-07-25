interface PostDataType {
  id: number;
  postId?: string;
  title?: string;
  body?: string;
  category?: string;
  pin?: number;
  noindex?: number;
  draft?: number;
  memo?: string | null;
  time?: string;
  lastmod?: string;
}

interface PostIndexedDataType extends Omit<PostDataType, "category">, WithRawExtendDataType<PostDataType> {
  category?: string[];
  noindex?: boolean;
  draft?: boolean;
}

interface PostType extends Omit<PostIndexedDataType, "time" | "lastmod"> {
  time?: Temporal.ZonedDateTime,
  lastmod?: Temporal.ZonedDateTime,
  // schedule?: boolean;
  localDraft?: boolean;
}

type PostPagesExtensionType = "ExtRSS" | "mochott";

interface PostPagesItemType extends Omit<PostType, "id" | "body"> {
  body?: string | mochott_article;
  id?: number;
  host?: string;
  extension?: PostPagesExtensionType;
  link?: string;
}

interface PostFormDraftType extends PostType {
  update?: string;
};

interface PostFormType extends Omit<PostFormDraftType, "time" | "lastmod" | "schedule"> {
  time?: string;
};

type OldPostType = {
  id?: number;
  postId?: string;
  userId?: string;
  title?: string;
  body?: string;
  category?: string[];
  pin?: number;
  noindex?: boolean;
  draft?: boolean;
  localDraft?: boolean;
  date?: Temporal.ZonedDateTime | null;
  updatedAt?: Temporal.ZonedDateTime | null;
  flags?: number | null;
  memo?: string | null;
}
