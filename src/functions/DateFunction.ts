// 日本標準時で年の取得をする
export function getJSTYear(date?: Date | null) {
  if (!date) return 0;
  return new Date(date.getTime() + 32400000).getUTCFullYear();
}

export function ToJST(date?: Date | null) {
  return (date?.toLocaleString("sv-SE", { timeZone: "Asia/Tokyo" }) + "+09:00");
}

export function ToFormJST(date?: Date | null) {
  return date
    ?.toLocaleString("sv-SE", { timeZone: "Asia/Tokyo" })
    .replace(" ", "T") || "";
}

export function dateISOfromLocaltime(item?: string, timezone = "+09:00") {
  return item ? new Date(item + timezone).toISOString() : "";
}

export function dateJISOfromDate(time?: Date | null) {
  return (
    time?.toLocaleString("sv-SE", { timeZone: "JST" }).replace(" ", "T") || ""
  );
}

export function FormatDate(date: Date, format_str = "Y-m-d H:i:s") {
  var d = date;
  var rp = format_str;
  var year = d.getFullYear().toString();
  rp = rp.replace(/Y/, year);
  rp = rp.replace(/y/, year.slice(-2));
  var month = (d.getMonth() + 1).toString();
  rp = rp.replace(/n/, month);
  rp = rp.replace(/m/, ("0" + month).slice(-2));
  var day = (d.getDate()).toString();
  rp = rp.replace(/j/, day);
  rp = rp.replace(/d/, ("0" + day).slice(-2));
  var week = d.getDay();
  rp = rp.replace(/w/, week.toString());
  rp = rp.replace(/WW/, ["日", "月", "火", "水", "木", "金", "土"][week]);
  var hour = d.getHours();
  var hour2 = hour % 12;
  var hour2i = (hour / 12 < 1) ? 0 : 1;
  rp = rp.replace(/G/, hour.toString());
  rp = rp.replace(/g/, hour2.toString());
  rp = rp.replace(/H/, ("0" + hour).slice(-2));
  rp = rp.replace(/h/, ("0" + hour2).slice(-2));
  rp = rp.replace(/AA/, ["午前", "午後"][hour2i]);
  var minute = d.getMinutes().toString();
  rp = rp.replace(/I/, minute);
  rp = rp.replace(/i/, ("0" + minute).slice(-2));
  var second = d.getSeconds().toString();
  rp = rp.replace(/S/, second);
  rp = rp.replace(/s/, ("0" + second).slice(-2));

  rp = rp.replace(/A/, ["AM", "PM"][hour2i]);
  rp = rp.replace(/a/, ["am", "pm"][hour2i]);
  rp = rp.replace(/W/, ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][week]);
  return rp;
}
