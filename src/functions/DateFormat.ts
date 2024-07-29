export function ToJST(date?: Date | null) {
  return (date?.toLocaleString("sv-SE", { timeZone: "Asia/Tokyo" }) + "+09:00");
}

export function ToFormJST(date?: Date | null) {
  return date
    ?.toLocaleString("sv-SE", { timeZone: "Asia/Tokyo" })
    .replace(" ", "T");
}
