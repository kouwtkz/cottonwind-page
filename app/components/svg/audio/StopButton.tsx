import type { SVGAttributes } from "react";

export default function StopButton(attributes: SVGAttributes<SVGSVGElement>) {
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
      <circle cx="18" cy="18" r="18" />
      <rect x="9" y="10" width="18" height="16" fill="white" />
    </svg>
  );
}
