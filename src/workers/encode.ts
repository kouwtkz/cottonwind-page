// パーセントエンコード化（RFC3986）
export function encodeRFC3986(text: string) {
  let encodedText = encodeURIComponent(text);
  const encoders: { [k: string]: string } = {
    '!': '%21',
    "'": '%27',
    '(': '%28',
    ')': '%29',
    '*': '%2A'
  }
  for (let key in encoders) {
    encodedText = encodedText.replaceAll(key, encoders[key]);
  }
  return encodedText;
}