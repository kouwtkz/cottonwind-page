const siteTimeZones = ["JST", "+09:00", "UTC"];
export const siteTimeZone = siteTimeZones.find((timeZone) => {
  try {
    new Date().toLocaleString("ja", { timeZone });
    return true;
  } catch { }
});

export const SiteDateOptions: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZoneName: "shortOffset",
  timeZone: siteTimeZone,
};

export function getTimeZoneMinute(timeZone?: string) {
  try {
    const timeString = new Date().toLocaleString("en-US", { timeZone, timeZoneName: "longOffset" });
    const m = timeString.match(/GMT([\+\-])(\d{2}):(\d{2})/);
    if (m) return (m[1] === "+" ? 1 : -1) * (Number(m[2]) * 60 + Number(m[3]));
    else return 0;
  } catch {
    return 0;
  }
}
export const siteTimeZoneMinute = getTimeZoneMinute(siteTimeZone);

export function timeZoneFromMinute(timeZoneMinute = siteTimeZoneMinute) {
  const s = (timeZoneMinute >= 0 ? "+" : "-");
  const a = Math.abs(timeZoneMinute);
  return s + ("0" + Math.floor(a / 60)).slice(-2) + ":" + ("0" + (a % 60)).slice(-2);
}
export const siteTimeZoneGMT = timeZoneFromMinute(siteTimeZoneMinute);

export function dateOffsetTimeZoneMinute(date: Date, timeZoneMinute = siteTimeZoneMinute) {
  return new Date(date.getTime() + 60000 * timeZoneMinute);
}

export function getYear(date?: Date | null, timeZoneMinute?: number) {
  if (date) return dateOffsetTimeZoneMinute(date, timeZoneMinute).getUTCFullYear();
  else return 0;
}

export function ToFormTime(date?: Date | null) {
  if (date) return dateOffsetTimeZoneMinute(date).toISOString().replace(/\..+$/, "");
  else return "";
}

export function IsoFormTime(value?: string) {
  return (value ? new Date(value + siteTimeZoneGMT) : new Date()).toISOString();
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

export function getLocalTimeOffset() {
  return timeZoneFromMinute(-(new Date().getTimezoneOffset()));
}
