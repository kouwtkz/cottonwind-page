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
        d="M18 0C8.05922 0 0.000553577 8.05832 2.84832e-08 17.999C2.84832e-08 17.9993 0 17.9997 0 18C0 23.415 2.3911 28.2715 6.17506 31.5713C7.94741 33.1146 10.0256 34.3169 12.3075 35.0775C13.2075 35.235 13.545 34.695 13.545 34.2225C13.545 34.074 13.5423 33.8059 13.5387 33.456C13.5321 32.799 13.5225 31.8537 13.5225 30.87C9 31.7025 7.83 29.7675 7.47 28.755C7.2675 28.2375 6.39 26.64 5.625 26.2125C4.995 25.875 4.095 25.0425 5.6025 25.02C7.02 24.9975 8.0325 26.325 8.37 26.865C9.99 29.5875 12.5775 28.8225 13.6125 28.35C13.77 27.18 14.2425 26.3925 14.76 25.9425C10.755 25.4925 6.57 23.94 6.57 17.055C6.57 15.0975 7.2675 13.4775 8.415 12.2175C8.235 11.7675 7.605 9.9225 8.595 7.4475C8.595 7.4475 10.1025 6.975 13.545 9.2925C14.985 8.8875 16.515 8.685 18.045 8.685C19.575 8.685 21.105 8.8875 22.545 9.2925C25.9875 6.9525 27.495 7.4475 27.495 7.4475C28.485 9.9225 27.855 11.7675 27.675 12.2175C28.8225 13.4775 29.52 15.075 29.52 17.055C29.52 23.9625 25.3125 25.4925 21.3075 25.9425C21.96 26.505 22.5225 27.585 22.5225 29.2725C22.5225 30.875 22.5125 32.2682 22.5059 33.1998C22.5025 33.6678 22.5 34.0194 22.5 34.2225C22.5 34.6819 22.8191 35.2264 23.6641 35.0908C27.5967 33.7881 30.9281 31.166 33.1339 27.7491C35.0007 24.8469 35.9991 21.4636 36 18C36 8.05922 27.9417 0.000553577 18.001 2.84832e-08C18.0007 2.84832e-08 18.0003 0 18 0Z"
        fill="black"
      />
    </svg>
  );
}
