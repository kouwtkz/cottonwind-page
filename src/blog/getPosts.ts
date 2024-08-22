import { findMee, setWhere } from "@/functions/findMee";

interface getPostsProps {
  posts: Post[];
  update?: boolean;
  take?: number;
  page?: number;
  q?: string;
  common?: boolean;
  pinned?: boolean;
}
export default function getPosts({
  posts,
  take,
  page,
  common,
  q = "",
  pinned = false,
}: getPostsProps) {
  if (page) page--;
  const skip = take && page ? take * page : 0;
  const options: WhereOptionsKvType<Post> = {
    text: { key: "body" },
    from: { key: "userId" },
    hashtag: { enableText: true, key: "category" },
  };
  const wheres = [setWhere(q, options).where];
  if (common) wheres.push({ draft: false, date: { lte: new Date() } });
  const orderBy: any[] = [];
  if (pinned) orderBy.push({ pin: "desc" });
  orderBy.push({ date: "desc" });

  try {
    let postsResult: Post[] = findMee({
      list: posts,
      where: {
        AND: wheres,
      },
      orderBy,
    });
    const count = postsResult.length;
    postsResult = postsResult.filter((post, i) => {
      if (take !== undefined && i >= take + skip) return false;
      return ++i > skip;
    });
    const max = Math.ceil(count / (take || count));
    return { posts: postsResult, count, max };
  } catch (e) {
    console.log(e);
    return { posts: [], count: 0, max: 0 };
  }
}
