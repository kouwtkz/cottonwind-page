// @ts-check

/**
 * @param {Date | null | undefined} date
 */
export function ToJST(date) {
  return (date?.toLocaleString("sv-SE", { timeZone: "Asia/Tokyo" }) + "+09:00") ?? "";
}

/**
 * @param {Date | null | undefined} date
 */
export function ToFormJST(date) {
  return date
    ?.toLocaleString("sv-SE", { timeZone: "Asia/Tokyo" })
    .replace(" ", "T") ?? ""
}