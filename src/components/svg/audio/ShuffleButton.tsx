import { SVGAttributes } from "react";

type ShuffleButtonProps = {
  shuffle?: boolean;
} & SVGAttributes<SVGSVGElement>;

export default function ShuffleButton({ shuffle, ...attributes }: ShuffleButtonProps) {
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
      <g style={{opacity: shuffle ? undefined : 0.95}}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M24.5 13.9991C24.5 13.9991 23.7021 14 23.5 14C22.001 14 21.1118 14.4946 20 15.5C19.0459 16.3628 17.8153 17.886 17 19C15.8902 20.5165 14.2909 22.2974 13 23.5C10.8788 25.4762 8.70205 26 7.5 26L6 26L6.00001 23L7.5 23C8.82032 23 10.4774 21.968 11.5 21C12.5226 20.0321 13.6183 18.7002 14.5 17.5C15.4296 16.2346 16.5811 14.7697 17.7132 13.6818C19.4803 11.9837 20.9416 11.1698 23.3864 10.9991C23.8547 10.9664 24.5884 10.9991 24.5884 10.9991L23.5884 8.5L24.5 8L30.5 12.5L24.5 17L23.5885 16.5L24.5 13.9991Z"
        fill="white"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M24.5 22.0009C24.5 22.0009 23.7021 22 23.5 22C22.001 22 21.1118 21.5054 20 20.5C19.0459 19.6372 17.8153 18.114 17 17C15.8902 15.4835 14.2909 13.7026 13 12.5C10.8788 10.5238 8.70205 10 7.5 10L6 10L6.00001 13L7.5 13C8.82032 13 10.4774 14.032 11.5 15C12.5226 15.9679 13.6183 17.2998 14.5 18.5C15.4296 19.7654 16.5811 21.2303 17.7132 22.3182C19.4803 24.0163 20.9416 24.8302 23.3864 25.0009C23.8547 25.0336 24.5884 25.0009 24.5884 25.0009L23.5884 27.5L24.5 28L30.5 23.5L24.5 19L23.5885 19.5L24.5 22.0009Z"
        fill="white"
      />
      </g>
      {shuffle ? null : <path d="M25 5L9.99999 31.0956" stroke="white" strokeWidth="4"/>}
      
    </svg>
  );
}
