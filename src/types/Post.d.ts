type Post = {
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

type PostFormType = {
  title?: string;
  body?: string;
  category?: string[];
  pin?: number;
  draft?: boolean;
  date?: Date;
  postId?: string;
  userId?: string;
};