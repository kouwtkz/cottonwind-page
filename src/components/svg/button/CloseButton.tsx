import { SVGAttributes } from "react";

export default function CloseButton(attributes: SVGAttributes<SVGSVGElement>) {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...attributes}
    >
      <path d="M6 5L31 30" stroke="white" strokeWidth="2" />
      <path d="M31 5L6 30" stroke="white" strokeWidth="2" />
    </svg>
  );
}
