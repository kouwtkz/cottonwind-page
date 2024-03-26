import { SVGAttributes } from "react";

export default function ArrowUpButton(
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
        d="M22.8 30L22.8 20L30 20L18 6L6 20L13.2 20L13.2 30L22.8 30Z"
        fill="white"
      />
    </svg>
  );
}
