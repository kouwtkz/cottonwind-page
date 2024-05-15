type FeedArticleType = {
  title: string;
  description: string;
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

type ZennChangeLogArticleType = {
  id: string;
  created_at: string;
  body_html: string;
}
type ZennChangeLogType = {
  title: string;
  url: string;
  list?: ZennChangeLogArticleType[];
}

type FeedKVType = {
  note?: FeedContentType;
  changeLog?: ZennChangeLogType;
}