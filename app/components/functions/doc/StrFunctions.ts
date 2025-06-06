export function toUpperFirstCase(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function CompactCode(value: unknown) {
  return String(value).replace(/\s+/g, " ")
}

export function JoinUnique(a?: string | string[] | null, b?: string | string[] | null, separator = ",") {
  if (!a && !b) return null;
  if (!Array.isArray(a)) a = a ? a.split(separator).reduce<string[]>((a, c) => {
    if (!a.some(v => v === c)) a.push(c);
    return a;
  }, []) : [];
  if (!Array.isArray(b)) b = b ? b.split(separator) : [];
  return b.reduce((a, c) => {
    if (!a.some(v => v === c)) a.push(c);
    return a;
  }, a).join(separator);
}

export function kanaToHira(str: string) {
  return str.replace(/[\u30a1-\u30f6]/g, (m) => {
    var chr = m.charCodeAt(0) - 0x60;
    return String.fromCharCode(chr);
  });
}
