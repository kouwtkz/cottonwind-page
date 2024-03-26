import { SVGAttributes } from "react";

export default function ArrowLeftButton(
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
      <path d="M29 13.2L19 13.2V6L5 18L19 30V22.8L29 22.8V13.2Z" fill="white" />
    </svg>
  );
}
