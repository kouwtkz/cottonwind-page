// @ts-check

/**
 * @typedef {{
 *  value: string;
 *  replaceT?: boolean;
 *  Normalize?: boolean;
 *  dayFirst?: boolean;
 *  dayLast?: boolean;
 *  forceDayTime?: boolean;
 * }} AutoAllotDateProps;
 */

/** @param {AutoAllotDateProps} args */
export function AutoAllotDate({ value, replaceT = true, Normalize = true, dayFirst = false, dayLast = false, forceDayTime = false }) {
  if (replaceT) value = value.replace(/[\s_]/, "T"); else value = value.replace(/[_]/, "T");
  const dateLength = value.split(/[-/]/, 3).length;
  const nonTime = forceDayTime || !/[T\s]/.test(value);
  if (forceDayTime && (dayFirst || dayLast)) value = value.replace(/[T\s][\d.:]+/, 'T00:00');
  else if (nonTime) value = value.replace(/([\d.:])(\+[\d:]+|Z|)$/, "$1T00:00$2")

  if (Normalize && /[T]/.test(value)) {
    value = value.replace(/(\d+)[-/]?(\d*)[-/]?(\d*)T(\d*):?(\d*):?(\d*)/, (m, m1, m2, m3, m4, m5, m6) => {
      /** @type string[] */
      let dateStr = []
      if (m1) dateStr.push(`000${m1}`.slice(-4));
      if (m2) dateStr.push(`0${m2}`.slice(-2));
      if (m3) dateStr.push(`0${m3}`.slice(-2));
      /** @type string[] */
      let timeStr = []
      if (m4 + m5 === "0000") timeStr.push("00", "00");
      else {
        if (m4) timeStr.push(`0${m4}`.slice(-2));
        if (m5) timeStr.push(`0${m5}`.slice(-2));
      }
      if (m6) timeStr.push(`0${m6}`.slice(-2));
      return dateStr.join("-") + "T" + timeStr.join(":");
    });
  }

  /** @type Date */
  let time;
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