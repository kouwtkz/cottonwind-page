import { HTMLAttributes } from "react";
import { AiFillCaretLeft, AiFillCaretRight } from "react-icons/ai";
import { useNavigate } from "react-router-dom";

interface BackForwardPostProps extends HTMLAttributes<HTMLDivElement> {
  postId: string;
  posts: Post[];
}

export default function BackForwardPost({
  postId,
  posts,
  className,
  ...args
}: BackForwardPostProps) {
  const nav = useNavigate();
  className = className ? ` ${className}` : "";
  const postIndex = posts.findIndex((post) => post.postId === postId);
  const beforePost = posts[postIndex - 1];
  const afterPost = posts[postIndex + 1];

  // const _min = 1;
  // const _max = max || 1;
  // const before;

  return (
    <div {...args} className={"paging" + className}>
      <button
        type="button"
        className="round"
        disabled={!beforePost}
        title={beforePost?.title || ""}
        onClick={() => {
          nav(`?postId=${beforePost.postId}`);
        }}
      >
        <AiFillCaretLeft className="svg" />
      </button>
      <button
        type="button"
        className="round"
        disabled={!afterPost}
        title={afterPost?.title || ""}
        onClick={() => {
          nav(`?postId=${afterPost.postId}`);
        }}
      >
        <AiFillCaretRight className="svg" />
      </button>
    </div>
  );
}
