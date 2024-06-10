import { HTMLAttributes } from "react";
import { PiHandsClapping } from "react-icons/pi";
import { Link } from "react-router-dom";

interface PostButtonProps extends HTMLAttributes<HTMLAnchorElement> {
  postId?: string;
}

export default function HandsClapButton({
  postId,
  className,
  ...args
}: PostButtonProps) {
  className = className ? ` ${className}` : "";
  const wavebox = import.meta.env.VITE_WAVEBOX;
  return wavebox ? (
    <Link
      {...args}
      to={wavebox}
      title="拍手ボタン"
      className={"button round" + className}
      target="_blank"
    >
      <PiHandsClapping className="svg" />
    </Link>
  ) : (
    <></>
  );
}
