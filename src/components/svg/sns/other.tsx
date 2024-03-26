import { SVGAttributes } from "react";

export default function MenuButton({
  className,
  ...attributes
}: SVGAttributes<SVGSVGElement>) {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...attributes}
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M36 18C36 27.9411 27.9411 36 18 36C8.05887 36 0 27.9411 0 18C0 8.05887 8.05887 0 18 0C27.9411 0 36 8.05887 36 18ZM16 18C16 20.7614 13.7614 23 11 23C8.23858 23 6 20.7614 6 18C6 15.2386 8.23858 13 11 13C13.7614 13 16 15.2386 16 18ZM25 23C27.7614 23 30 20.7614 30 18C30 15.2386 27.7614 13 25 13C22.2386 13 20 15.2386 20 18C20 20.7614 22.2386 23 25 23Z"
        fill="black"
      />
    </svg>
  );
}
