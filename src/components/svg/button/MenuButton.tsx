import React, { SVGAttributes } from "react";

type MenuButtonProps = {
  isOpen?: boolean;
} & SVGAttributes<SVGElement>

export default function MenuButton({
  className,
  isOpen,
  ...attributes
}: MenuButtonProps) {
  return (
    <svg
      width="60"
      height="60"
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={
        "MenuButton hover:cursor-pointer" + (className ? ` ${className}` : "")
      }
      {...attributes}
    >
      <path
        d="M0 0H60V60H0V0Z"
        fillOpacity="0.8"
      />
      <g className={isOpen ? "hidden" : ""}>
        <rect
          className="Line1"
          x="11"
          y="42"
          width="38"
          height="4"
          fill="white"
        />
        <rect
          className="Line2"
          x="11"
          y="28"
          width="38"
          height="4"
          fill="white"
        />
        <rect
          className="Line3"
          x="11"
          y="14"
          width="38"
          height="4"
          fill="white"
        />
      </g>
      <g className={isOpen ? "" : "hidden"}>
        <path
          d="M46.6968 43.8683L15.8301 13.0017L13.0017 15.8301L43.8683 46.6968L46.6968 43.8683Z"
          fill="white"
        />
        <path
          d="M43.8683 13.0017L13.0017 43.8683L15.8301 46.6968L46.6968 15.8301L43.8683 13.0017Z"
          fill="white"
        />
      </g>
    </svg>
  );
}
