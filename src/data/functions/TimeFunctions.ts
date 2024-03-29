// 日本標準時で年の取得をする
export function getJSTYear(date?: Date | null) {
  if (!date) return 0;
  return new Date(date.getTime() + 32400000).getUTCFullYear();
}
