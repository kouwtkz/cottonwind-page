import type { SVGAttributes } from "react";

export default function LinkVtdonButton({
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
        d="M18 36C27.9411 36 36 27.9411 36 18C36 8.05887 27.9411 0 18 0C8.05887 0 0 8.05887 0 18C0 27.9411 8.05887 36 18 36ZM13 5.01556L10 10.2656V27.1704L13 21.7704V21V13V5.01556ZM10.673 28.0182L13.6381 22.6809L31.2481 13.876L27.8043 19.2329L10.673 28.0182ZM32.442 13.8681L33 13L25 9L21 11L20.8759 6.93796L13 3L12.4857 3.89995L9 10V28.8762V28.9704V30L9.79986 29.5898L10 29.4872L28.5 20L32.442 13.8681Z"
        fill="black"
      />
    </svg>
  );
}
