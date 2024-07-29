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

interface AutoAllotDateProps {
  value: string;
  replaceT?: boolean;
  Normalize?: boolean;
  dayFirst?: boolean;
  dayLast?: boolean;
  forceDayTime?: boolean;
}

export function AutoAllotDate({ value, replaceT = true, Normalize = true, dayFirst = false, dayLast = false, forceDayTime = false }: AutoAllotDateProps) {
  if (replaceT) value = value.replace(/[\s_]/, "T"); else value = value.replace(/[_]/, "T");
  const dateLength = value.split(/[-/]/, 3).length;
  const nonTime = forceDayTime || !/[T\s]/.test(value);
  if (forceDayTime && (dayFirst || dayLast)) value = value.replace(/[T\s][\d.:]+/, 'T00:00');
  else if (nonTime) value = value.replace(/([\d.:])(\+[\d:]+|Z|)$/, "$1T00:00$2")

  if (Normalize && /[T]/.test(value)) {
    value = value.replace(/(\d+)[-/]?(\d*)[-/]?(\d*)T(\d*):?(\d*):?(\d*)/, (m, m1, m2, m3, m4, m5, m6) => {
      let dateStr: string[] = []
      if (m1) dateStr.push(`000${m1}`.slice(-4));
      if (m2) dateStr.push(`0${m2}`.slice(-2));
      if (m3) dateStr.push(`0${m3}`.slice(-2));
      let timeStr: string[] = []
      if (m4 + m5 === "0000") timeStr.push("00", "00");
      else {
        if (m4) timeStr.push(`0${m4}`.slice(-2));
        if (m5) timeStr.push(`0${m5}`.slice(-2));
      }
      if (m6) timeStr.push(`0${m6}`.slice(-2));
      return dateStr.join("-") + "T" + timeStr.join(":");
    });
  }

  let time: Date;
  if (value.endsWith("Z") || /\+/.test(value))
    time = new Date(value);
  else
    time = new Date(`${value}+09:00`);
  if (dayLast && nonTime) {
    if (dateLength === 1) time.setUTCFullYear(time.getUTCFullYear() + 1);
    else if (dateLength === 2) time.setUTCMonth(time.getUTCMonth() + 1);
    else time.setUTCDate(time.getUTCDate() + 1);
    time.setUTCMilliseconds(-1);
  }
  return time;
}