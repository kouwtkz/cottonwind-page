interface PostDataType {
  id: number;
  postId: string;
  title?: string;
  body?: string;
  category?: string;
  pin?: number;
  noindex?: number;
  draft?: number;
  flags?: number | null;
  memo?: string | null;
  time?: string;
  lastmod?: string;
}

interface PostType extends PostDataType {
  category?: string[];
  noindex?: boolean;
  draft?: boolean;
  localDraft?: boolean;
  time?: Date,
  lastmod?: Date,
}

type PostType = {
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
  date?: Date | null;
  updatedAt?: Date | null;
  flags?: number | null;
  memo?: string | null;
}

type OldPostFormType = {
  title?: string;
  body?: string;
  category?: string[];
  pin?: number;
  draft?: boolean;
  date?: Date;
  postId?: string;
  userId?: string;
};