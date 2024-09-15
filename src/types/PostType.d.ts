interface PostDataType {
  id: number;
  postId: string;
  title?: string;
  body?: string;
  category?: string;
  pin?: number;
  noindex?: number;
  draft?: number;
  schedule?: number;
  memo?: string | null;
  time?: string;
  lastmod?: string;
}

interface PostType extends PostDataType {
  category?: string[];
  noindex?: boolean;
  draft?: boolean;
  schedule?: boolean;
  localDraft?: boolean;
  time?: Date,
  lastmod?: Date,
}

interface PostFormType extends Omit<PostType, "time" | "lastmod"> {
  time?: string;
  postId?: string;
  update: string;
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
  date?: Date | null;
  updatedAt?: Date | null;
  flags?: number | null;
  memo?: string | null;
}
