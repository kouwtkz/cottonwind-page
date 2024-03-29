/**
 * @param {Date} date 
 * @returns 
 */
export function ToJST(date) {
  return date.toLocaleString("sv-SE", { timeZone: "Asia/Tokyo" }) + "+09:00";
}