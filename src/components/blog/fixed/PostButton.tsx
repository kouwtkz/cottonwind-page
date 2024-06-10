import { HTMLAttributes } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { AiFillEdit } from "react-icons/ai";
import { TfiWrite } from "react-icons/tfi";
import { useNavigate } from "react-router-dom";

interface PostButtonProps extends HTMLAttributes<HTMLButtonElement> {
  postId?: string;
}

export default function PostButton({
  postId,
  className,
  ...args
}: PostButtonProps) {
  className = className ? ` ${className}` : "";
  const nav = useNavigate();
  const link = `/blog/post${postId ? `?target=${postId}` : ""}`;
  useHotkeys("n", () => nav(link));
  return (
    <button {...args} className={"round" + className} onClick={() => nav(link)}>
      {postId ? (
        <TfiWrite className="svg" />
      ) : (
        <AiFillEdit className="svg" />
      )}
    </button>
  );
}
