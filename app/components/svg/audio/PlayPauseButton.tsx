import { type SVGAttributes, memo } from "react";

type PlayPauseButtonProps = {
  paused?: boolean;
} & SVGAttributes<SVGSVGElement>;

const PausePath = memo(function PausePath() {
  return (
    <g strokeWidth={0}>
      <rect x="9" y="9" width="6" height="18" />
      <rect x="21" y="9" width="6" height="18" />
    </g>
  );
});
const PlayPath = memo(function PlayPath() {
  return (
    <g strokeWidth={0}>
      <path d="M30.5 17.7415L11 28.1338L11 7.34915L30.5 17.7415Z" />
    </g>
  );
});

export default function PlayPauseButton({
  paused = true,
  ...attributes
}: PlayPauseButtonProps) {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      name="pause"
      {...attributes}
    >
      {paused ? <PlayPath /> : <PausePath />}
    </svg>
  );
}
