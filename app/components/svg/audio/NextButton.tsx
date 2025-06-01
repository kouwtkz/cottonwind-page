import { SVGAttributes } from "react";

export default function NextButton(attributes: SVGAttributes<SVGSVGElement>) {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      name="stop"
      {...attributes}
    >
      <path d="M21.75 17.6603L9 26.3205L9 9L21.75 17.6603Z" strokeWidth={0} />
      <path d="M23.75 9.66028H26.75V25.6603H23.75V9.66028Z" strokeWidth={0} />
    </svg>
  );
}
