export function findMee<T>({
  list,
  where,
  take,
  orderBy,
  skip = 0,
}: findMeeProps<T>): T[] {
  if (!list) return [];
  orderBy
    ?.reduce((a, c) => {
      Object.entries(c).forEach(([k, v]) => {
        if (a.findIndex((f) => k in f) < 0) {
          if (c) a.push({ [k]: v as OrderByType });
        }
      });
      return a;
    }, [] as { [k: string]: OrderByType }[])
    .forEach((args) => {
      Object.entries(args).forEach(([k, v]) => {
        let sign = 0;
        switch (v) {
          case "asc":
            sign = 1;
            break;
          case "desc":
            sign = -1;
            break;
        }
        if (sign !== 0) {
          list.sort((a: any, b: any) => {
            let result = 0;
            const judgeValue = a[k] ?? b[k];
            const typeofValue = typeof judgeValue;
            switch (typeofValue) {
              case "string":
                result = a[k].localeCompare(b[k], 'ja');
                break;
              case "number":
                result = a[k] - b[k];
                break;
              case "object":
                if ("getTime" in judgeValue) {
                  const atime = a[k]?.getTime() || 0;
                  const btime = b[k]?.getTime() || 0;
                  if (atime !== btime) result = atime - btime;
                }
                break;
              default:
                result = a[k] > b[k] ? 1 : a[k] < b[k] ? -1 : 0;
                break;
            }
            result = result * sign;
            return result;
          });
        }
      });
    });
  let i = 0;
  return list.filter((value) => {
    if (take !== undefined && i >= take + skip) return false;
    const result = whereLoop(value, where);
    if (result) i++;
    return result && i > skip;
  });
}

function whereLoop<T>(value: T, where: findWhereType<T> | undefined): boolean {
  function recursion(__where: findWhereType<T>): boolean {
    return Object.entries(__where).every(([fkey, fval]) => {
      const fvalWheres: findWhereType<T>[] = fval;
      switch (fkey) {
        case "AND":
          return fvalWheres.every((_val) => recursion(_val));
        case "OR":
          return fvalWheres.some((_val) => recursion(_val));
        case "NOT":
          return !fvalWheres.some((_val) => recursion(_val));
        default:
          const _value: any = value;
          const cval = _value[fkey];
          if (typeof fval === "object") {
            const _conditions: [any, any][] = Object.entries(fval);
            const conditions: [filterConditionsAllType, any][] = _conditions;
            return conditions.every(([k, v]) => {
              switch (k) {
                case "equals":
                  if (typeof cval === "string") return String(cval).toLocaleLowerCase() === v;
                  else return cval == v;
                case "not":
                  return cval != v;
                case "contains":
                  if (Array.isArray(cval)) return cval.some((x) => x.toLocaleLowerCase() === v);
                  else if (typeof v === "object" && "test" in v) return v.test(cval);
                  else return String(cval).toLocaleLowerCase().includes(v);
                case "startsWith":
                  return String(cval).toLocaleLowerCase().startsWith(v);
                case "endsWith":
                  return String(cval).toLocaleLowerCase().endsWith(v);
                case "gt":
                  return cval > v;
                case "gte":
                  return cval >= v;
                case "lt":
                  return cval < v;
                case "lte":
                  return cval <= v;
                case "in":
                  const inVal = v as unknown[];
                  return inVal.some(v => v == cval);
                case "between":
                  const betweenVal = v as any[];
                  return betweenVal[0] <= cval && cval <= betweenVal[1];
                case "bool":
                  let boolVal: boolean;
                  if (Array.isArray(cval)) boolVal = cval.length > 0;
                  else boolVal = Boolean(cval);
                  return v ? boolVal : !boolVal;
                default:
                  return false;
              }
            });
          } else {
            return cval == fval;
          }
      }
    });
  }
  return where ? recursion(where) : true;
}

export function createFilterEntry(
  filterValue: string
): filterConditionsAllKeyValue<any> {
  if (filterValue.startsWith('"') && filterValue.endsWith('"')) {
    return {
      equals: filterValue.slice(1, -1),
    };
  } else {
    return {
      contains: filterValue,
    };
  }
}

function getKeyFromOptions<T>(key: WhereOptionsKeyUnion, options: WhereOptionsKvType<T>): (string | string[]) {
  const _options = options as any;
  return typeof _options[key] === "object" && ("key" in _options[key])
    ? _options[key].key
    : key;
}

function whereFromKey(key: string | string[], value: findWhereWithConditionsType<any>): findWhereType<any> {
  if (Array.isArray(key)) {
    return {
      OR: key.map(k => {
        return { [k]: value }
      })
    };
  } else {
    return { [key]: value };
  }
}

export function setWhere<T = any>(q: string = "", options: WhereOptionsKvType<T> = {}) {
  const textKey = getKeyFromOptions("text", options);
  const fromKey = getKeyFromOptions("from", options);
  const timeKey = getKeyFromOptions("time", options);
  const hashtagKey = options.hashtag?.key ?? "hashtag";
  const kanaReplace = options.kanaReplace ?? false;
  const enableHashtagKey = options.hashtag?.enableKey ?? true;
  const enableHashtagText = options.hashtag?.enableText ?? false;
  const whereList: findWhereType<any>[] = [];
  let id: number | undefined;
  let take: number | undefined;
  const orderBy: OrderByKeyStr[] = [];
  let OR = false;
  const doubleQuoteDic: KeyValueType<string> = {};
  let i = 0;
  q = q.replace(/"([^"]+)"/g, (m, m1) => {
    const key = (i++).toString(16);
    m1 = m1.toLocaleLowerCase();
    if (kanaReplace) m1 = kanaToHira(m1);
    doubleQuoteDic[key] = m1;
    return `"${key}"`;
  })
  const searchArray = q.trim().split(/\s+/);
  searchArray.forEach((item) => {
    if (item === "OR") {
      OR = true;
    } else {
      let whereItem: findWhereType<any> | undefined;
      item = item.toLocaleLowerCase();
      let NOT = item.startsWith("-");
      if (NOT) item = item.slice(1);
      if (item.length > 1 && item.startsWith("#")) {
        const filterValue = item.slice(1).toLocaleLowerCase();
        const whereHashtags: findWhereWithConditionsType<any>[] = [];
        if (enableHashtagKey) {
          (Array.isArray(hashtagKey) ? hashtagKey : [hashtagKey])
            .forEach(k => {
              whereHashtags.push({
                [k]: {
                  contains: filterValue
                }
              })
            })
        }
        if (enableHashtagText) {
          (Array.isArray(textKey) ? textKey : [textKey])
            .forEach(k => {
              whereHashtags.push({
                [k]: {
                  contains: new RegExp(
                    `#${filterValue.replace(/(\+)/g, "\\$1")}(\\s|$)`,
                    "i"
                  )
                }
              })
            })
        }
        if (whereHashtags.length > 0) {
          whereItem = { OR: whereHashtags };
        }
      } else {
        const colonIndex = /^\w+:\/\//.test(item) ? -1 : item.indexOf(":");
        const switchKey = colonIndex >= 0 ? item.slice(0, colonIndex) : "";
        const UNDER = switchKey.startsWith("_");
        let filterKey = UNDER ? switchKey.slice(1) : switchKey;
        let filterValue = switchKey.length > 0 ? item.slice(switchKey.length + 1) : item;
        filterKey = filterKey.replace(/"([^"])"/g, (m, m1) => doubleQuoteDic[m1]);
        filterValue = filterValue.replace(/"([^"])"/g, (m, m1) => doubleQuoteDic[m1]);
        if (kanaReplace) filterValue = kanaToHira(filterValue);
        let filterOptions: WhereOptionsType<T>;
        switch (typeof options[filterKey]) {
          case "object":
            filterOptions = (options as any)[filterKey];
            break;
          case "function":
            filterOptions = { where: (options as any)[filterKey] };
            break;
          case "undefined":
            filterOptions = {};
            break;
          default:
            filterOptions = { key: (options as any)[filterKey] };
            break;
        }
        let filterTake = filterOptions.take;
        switch (switchKey) {
          case "":
            if (item) {
              whereItem = whereFromKey(textKey, { contains: filterValue });
            }
            break;
          case "id":
            id = Number(filterValue);
            break;
          case "take":
            take = Number(filterValue);
            break;
          case "order":
            const orderValue = filterValue.toLocaleLowerCase();
            switch (orderValue) {
              case "asc":
              case "desc":
                Array.isArray(timeKey) ? timeKey : [timeKey].forEach((k) => {
                  orderBy.push({ [k]: orderValue });
                })
                break;
            }
            break;
          case "sort":
            const sortOrder = filterValue.includes("!");
            const sortKey = sortOrder
              ? filterValue.replace("!", "")
              : filterValue;
            switch (sortKey) {
              case "date":
              case "update":
                orderBy.push({ [sortKey]: sortOrder ? "asc" : "desc" });
                break;
              default:
                orderBy.push({ [sortKey]: sortOrder ? "desc" : "asc" });
                break;
            }
            break;
          case "from":
            whereItem = whereFromKey(fromKey, {
              equals: filterValue,
            });
            break;
          case "since":
            whereItem = whereFromKey(timeKey, {
              gte: AutoAllotDate({
                value: String(filterValue),
                dayFirst: true,
              }),
            });
            break;
          case "until":
            whereItem = whereFromKey(timeKey, {
              lte: AutoAllotDate({
                value: String(filterValue),
                dayLast: true,
              }),
            });
            break;
          case "filter":
          case "has":
            switch (filterValue.toLowerCase()) {
              case "media":
              case "images":
                whereItem = whereFromKey(textKey, {
                  contains: "![%](%)",
                });
                break;
              case "publish":
                whereItem = {
                  draft: {
                    equals: false,
                  },
                };
                break;
              case "draft":
                whereItem = {
                  draft: {
                    equals: true,
                  },
                };
                break;
              case "pinned":
                whereItem = {
                  pin: {
                    gt: 0,
                  },
                };
                break;
              case "no-pinned":
                whereItem = {
                  pin: {
                    equals: 0,
                  },
                };
                break;
              case "secret-pinned":
                whereItem = {
                  pin: {
                    lt: 0,
                  },
                };
                break;
            }
            break;
          default:
            if (filterOptions.where) {
              whereItem = filterOptions.where(filterValue);
            } else {
              const key = filterOptions.key ?? filterKey;
              let filterEntry: filterConditionsAllKeyValue<any>;
              switch (filterValue) {
                case "true":
                case "false":
                  const bool = filterValue === "true";
                  if (!bool && filterTake) filterTake = undefined;
                  filterEntry = { bool };
                  break;
                default:
                  filterEntry = { contains: filterValue };
                  break;
              }
              whereItem = whereFromKey(key, filterEntry);
            }
            break;
        }
        if (typeof take !== "number" && typeof filterTake === "number") {
          take = filterTake;
        }
      }
      if (whereItem) {
        console.log(whereItem);
        if (NOT) whereItem = { NOT: [whereItem] }
        whereList.push(whereItem);
      }
      if (OR) {
        const current = whereList.pop();
        const before = whereList.pop();
        if (before && "OR" in before) {
          before.OR.push(current);
          whereList.push(before);
        } else {
          whereList.push({
            OR: [before, current],
          });
        }
        OR = false;
      }
    }
  });
  const where: findWhereType<T> = whereList.length > 1 ? { AND: whereList } : (whereList[0] ?? {});
  return { where, id, take, orderBy };
}

function kanaToHira(str: string) {
  return str.replace(/[\u30a1-\u30f6]/g, (m) => {
    var chr = m.charCodeAt(0) - 0x60;
    return String.fromCharCode(chr);
  });
}


interface AutoAllotDateProps {
  value: string;
  replaceT?: boolean;
  Normalize?: boolean;
  dayFirst?: boolean;
  dayLast?: boolean;
  forceDayTime?: boolean;
}

function AutoAllotDate({ value, replaceT = true, Normalize = true, dayFirst = false, dayLast = false, forceDayTime = false }: AutoAllotDateProps) {
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
