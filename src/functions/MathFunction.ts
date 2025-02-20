export function LimitValue(value: number, { min, max }: { min?: number, max?: number }) {
  if (typeof min !== "undefined" && min > value) value = min;
  if (typeof max !== "undefined" && max < value) value = max;
  return value;
}