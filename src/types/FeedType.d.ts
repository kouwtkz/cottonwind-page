type FeedArticleType = {
  title: string;
  link: string;
  category: string[];
  date: string;
};

type FeedContentType = {
  title?: string;
  link?: string;
  description?: string;
  list?: FeedArticleType[];
};

type ZennScrapCommentType = {
  id: string;
  created_at: string;
  body_html: string;
}
type ZennScrapType = {
  title: string;
  url: string;
  list?: ZennScrapCommentType[];
}

type FeedContentsType = {
  note?: FeedContentType;
}

type FeedDBType = {
  name: string,
  date: string,
  data: string
}

interface GitItemType {
  date: string;
  messages: string[];
}

interface GitObjectType {
  remote_url?: string;
  list: GitItemType[];
}
