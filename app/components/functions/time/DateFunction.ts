import 'temporal-polyfill/global'
export const siteTimeZone: Temporal.TimeZoneLike = import.meta.env.VITE_SITE_TIMEZONE || Temporal.Now.timeZoneId();

export function getYear(date?: Temporal.DateLikeObject | Temporal.Instant | Date | null) {
  if (date) {
    if ("year" in date) return date.year;
    else if ("toZonedDateTimeISO" in date)
      return date.toZonedDateTimeISO(Temporal.Now.timeZoneId()).year;
    else if ("getFullYear" in date) return date.getFullYear();
  }
  return 0;
}

// フォームの編集時に使う
export function ToFormTime(date?: Temporal.PlainDateTime | Temporal.ZonedDateTime | Temporal.Instant | Date | null) {
  if (date && typeof date === "object") {
    if ("toZonedDateTimeISO" in date) {
      return date.toZonedDateTimeISO(siteTimeZone).toPlainDateTime().toLocaleString();
    } else if ("toPlainDateTime" in date)
      return date.toPlainDateTime().toLocaleString();
    else if ("with" in date)
      return date.toLocaleString();
    else return date.toISOString().replace(/\..+$/, "");
  }
  else return "";
}

// フォームの送信時に使う
export function FormStrTimeToIsoString(value?: string) {
  return (value ? Temporal.PlainDateTime.from(value) : Temporal.Now.plainDateTimeISO())
    .toZonedDateTime(siteTimeZone).toInstant().toString({ smallestUnit: "millisecond" });
}

export function FormatDate(date: Temporal.Instant | Temporal.ZonedDateTime | Temporal.PlainDateTime | Date, format_str = "Y-m-d H:i:s", UTC = false) {
  let d: Temporal.ZonedDateTime;
  if ("toZonedDateTimeISO" in date) {
    d = date.toZonedDateTimeISO(UTC ? "UTC" : siteTimeZone);
  } else if ("toZonedDateTime" in date) {
    d = date.toZonedDateTime(UTC ? "UTC" : siteTimeZone);
  } else if ("getTime" in date) {
    d = DateToZonedDateTime(date, UTC);
  } else {
    d = date;
  }
  let rp = format_str;
  const year = d.year.toString();
  rp = rp.replace(/Y/, year);
  rp = rp.replace(/y/, year.slice(-2));
  const month = d.month.toString();
  rp = rp.replace(/n/, month);
  rp = rp.replace(/m/, ("0" + month).slice(-2));
  const day = d.day.toString();
  rp = rp.replace(/j/, day);
  rp = rp.replace(/d/, ("0" + day).slice(-2));
  const week = d.dayOfWeek;
  rp = rp.replace(/w/, week.toString());
  rp = rp.replace(/WW/, ["日", "月", "火", "水", "木", "金", "土"][week]);
  const hour = d.hour;
  const hour2 = hour % 12;
  const hour2i = (hour / 12 < 1) ? 0 : 1;
  rp = rp.replace(/G/, hour.toString());
  rp = rp.replace(/g/, hour2.toString());
  rp = rp.replace(/H/, ("0" + hour).slice(-2));
  rp = rp.replace(/h/, ("0" + hour2).slice(-2));
  rp = rp.replace(/AA/, ["午前", "午後"][hour2i]);
  const minute = d.minute.toString();
  rp = rp.replace(/I/, minute);
  rp = rp.replace(/i/, ("0" + minute).slice(-2));
  const second = d.second.toString();
  rp = rp.replace(/S/, second);
  rp = rp.replace(/s/, ("0" + second).slice(-2));

  rp = rp.replace(/A/, ["AM", "PM"][hour2i]);
  rp = rp.replace(/a/, ["am", "pm"][hour2i]);
  rp = rp.replace(/W/, ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][week]);
  return rp;
}

export function ISOStringToZonedDateTime(value: string) {
  return Temporal.Instant.from(value).toZonedDateTimeISO(siteTimeZone);
}

export function DateToZonedDateTime(date: Date, UTC = false) {
  return Temporal.Instant.fromEpochMilliseconds(
    date.getTime(),
  ).toZonedDateTimeISO(UTC ? "UTC" : siteTimeZone)
}

export function DateNotEqual(date1: Date, date2: Date) {
  return (
    date1.getFullYear() !== date2.getFullYear() ||
    date1.getMonth() !== date2.getMonth() ||
    date1.getDate() !== date2.getDate()
  );
}

export function toDayStart(date: Date) {
  date.setMilliseconds(0);
  date.setSeconds(0);
  date.setMinutes(0);
  date.setHours(0);
}
