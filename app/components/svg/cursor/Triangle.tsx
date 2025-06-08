import type { SVGAttributes } from "react";

type MenuButtonProps = {
  isOpen?: boolean;
} & SVGAttributes<SVGElement>;

export default function TriangleCursor({
  isOpen,
  ...attributes
}: MenuButtonProps) {
  return (
    <svg
      width="15"
      height="22"
      viewBox="0 0 15 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...attributes}
    >
      <path d="M15 11L0.500003 21.3923L0.500004 0.607665L15 11Z" />
    </svg>
  );
}
