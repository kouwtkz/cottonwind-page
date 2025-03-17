export function strToNumWithNull(str: string | null) {
  const num = Number(str);
  if (isNaN(num)) return null;
  else return num;
}