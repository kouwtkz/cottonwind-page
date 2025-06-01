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

type FeedDBType = {
  date: string,
  data: string
}
