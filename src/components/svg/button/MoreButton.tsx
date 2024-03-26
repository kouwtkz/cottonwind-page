import { SVGAttributes } from "react";

export default function MoreButton(attributes: SVGAttributes<SVGSVGElement>) {
  return (
    <svg
      width="235"
      height="235"
      viewBox="0 0 235 235"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...attributes}
    >
      <rect width="235" height="235" />
      <path
        d="M35 30.2441C35 28.7554 36.5683 27.7885 37.8984 28.4572L211.446 115.713C212.915 116.452 212.915 118.548 211.446 119.287L37.8984 206.543C36.5683 207.211 35 206.245 35 204.756V30.2441Z"
        fill="white"
      />
    </svg>
  );
}
