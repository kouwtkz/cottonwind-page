const prisma: any = {};
type getPostDetailProps = {
  postId: string
}

export default async function getPostDetail(args: getPostDetailProps) {
  const { postId } = args;
  try {
    const post = await prisma.post.findFirst({
      where: {
        postId: postId
      },
      include: {
        // ユーザー情報も含める（POSTテーブルにないもの、JOIN文）
        user: {
          select: {
            name: true,
            icon: true,
          },
        },
      },
    });
    if (!post) return null
    return post;
  } catch (error) {
    console.log(error)
    return null
  }
}
