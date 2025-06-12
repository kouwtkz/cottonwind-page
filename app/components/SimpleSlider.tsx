import { useMemo } from "react";

interface SimpleSliderProps {
  value?: number;
  max?: number;
}
export function SimpleSlider({ value = 0, max = 100 }: SimpleSliderProps) {
  const width = useMemo(() => `${(value / (max || 1)) * 100}%`, [value, max]);
  return (
    <div className="slider">
      <div className="track track-0" style={{ width }} />
      <div className="track track-1" style={{ width: "100%" }} />
    </div>
  );
}
