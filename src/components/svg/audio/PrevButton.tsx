import { SVGAttributes } from "react";

export default function PrevButton(attributes: SVGAttributes<SVGSVGElement>) {
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
      <path d="M14 17.6603L26.75 26.3205L26.75 9L14 17.6603Z" strokeWidth={0} />
      <path d="M12 9.66028H9V25.6603H12V9.66028Z" strokeWidth={0} />
    </svg>
  );
}
