import { CommonContext } from "@/types/HonoCustomType";

export async function getPostsData(c: CommonContext) {
  const rawPosts: Post[] = JSON.parse(await c.env.KV.get("posts") || '[]');
  const posts = rawPosts.filter(post => post);
  posts.forEach(post => {
    post.date = post.date ? new Date(post.date) : null;
    post.updatedAt = post.updatedAt ? new Date(post.updatedAt) : null;
  })
  return posts;
}
export async function setPostsData(c: CommonContext, posts: Post[]) {
  posts.forEach((post) => { post.body = post.body?.replace(/\r\n/g, "\n") });
  await c.env.KV.put("posts", JSON.stringify(posts));
}
