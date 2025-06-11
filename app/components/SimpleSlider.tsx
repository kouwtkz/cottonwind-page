interface SimpleSliderProps {
  value?: number;
  max?: number;
}
export function SimpleSlider({ value = 0, max = 100 }: SimpleSliderProps) {
  return (
    <div className="slider">
      <div
        className="track track-0"
        style={{ width: `${(value / max) * 100}%` }}
      />
      <div className="track track-1" style={{ width: "100%" }} />
    </div>
  );
}
