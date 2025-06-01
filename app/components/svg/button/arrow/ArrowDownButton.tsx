import { SVGAttributes } from "react";

export default function ArrowDownButton(
  attributes: SVGAttributes<SVGSVGElement>
) {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...attributes}
    >
      <circle cx="18" cy="18" r="18" />
      <path
        d="M22.8 6L22.8 16L30 16L18 30L6 16L13.2 16L13.2 6L22.8 6Z"
        fill="white"
      />
    </svg>
  );
}
