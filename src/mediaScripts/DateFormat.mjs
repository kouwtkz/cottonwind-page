/**
 * @param {Date} date 
 * @returns 
 */
export function ToJST(date) {
  return date.toLocaleString("sv-SE", { timeZone: "JST" }) + "+09:00";
}