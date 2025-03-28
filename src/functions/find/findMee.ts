export function findMee<T>(
  list: T[],
  {
    where,
    take,
    orderBy,
    skip = 0,
  }: findMeeProps<T>): T[] {
  orderBy
    ?.reduce<{ [k: string]: OrderByType }[]>((a, c) => {
      Object.entries(c).forEach(([k, v]) => {
        if (a.findIndex((f) => k in f) < 0) {
          if (c) a.push({ [k]: v as OrderByType });
        }
      });
      return a;
    }, [])
    .forEach((args) => {
      parseEntryKeys(args).forEach((_k) => {
        const v = fromEntryKeys(args, _k);
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
            const valueA = fromEntryKeys(a, _k);
            const valueB = fromEntryKeys(b, _k);
            const judgeValue = valueA || valueB;
            const typeofValue = typeof judgeValue;
            switch (typeofValue) {
              case "string":
                if (valueA && valueB) result = valueA.localeCompare(valueB, 'ja');
                break;
              case "number":
                result = (valueA || 0) - (valueB || 0);
                break;
              case "object":
                if (judgeValue && "getTime" in judgeValue) {
                  const atime = valueA?.getTime() || 0;
                  const btime = valueB?.getTime() || 0;
                  if (atime !== btime) result = atime - btime;
                }
                break;
              default:
                result = valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
                break;
            }
            result = result * sign;
            return result;
          });
        }
      });
    });
  let i = 0;
  const wheres = SetWheres(where);
  return list.filter((value) => {
    if (take !== undefined && i >= take + skip) return false;
    const result = wheresFilter(value, wheres);
    if (result) i++;
    return result && i > skip;
  });
}

function parseEntryKeys(o: any) {
  const r: string[][] = [];
  function rdf(o: Object, ca: string[] = []) {
    Object.entries(o).forEach(([k, v]) => {
      if (typeof v === "object") {
        rdf(v, [...ca, k])
      } else {
        r.push([...ca, k]);
      }
    }, []);
  }
  rdf(o);
  return r;
}
function fromEntryKeys(o: any, keys: string[]) {
  return keys.reduce<any>((a, c) => {
    if (a) {
      if (c in a) {
        return a[c];
      } else {
        return;
      }
    } else return a;
  }, o);
}

type WheresEntriesType = [string, unknown][];
function SetWheres<T>(v: T): WheresEntriesType | null {
  function f(v: any, d?: any): any[] {
    if (typeof v === "object" && v) {
      if (Array.isArray(v)) return v.map(_ => f(_));
      else if (/^\[object .+\]$/.test(v.toString())) {
        return (Object.entries(v)).map(([k, v]) => [k, f(v)]);
      }
      else return v;
    }
    else return d ?? v;
  }
  return f(v, null);
}
function compareWheres(obj: any, wheres: WheresEntriesType): boolean {
  return wheres.every(([k, w]) => Array.isArray(w) ? compareWheres(obj[k], w) : obj[k] == w);
}
function wheresFilter<T>(value: T, wheres?: WheresEntriesType | null): boolean {
  function wheresLoop(wheres: WheresEntriesType): boolean {
    return wheres.every(([fkey, fval]) => {
      const fvalWheres: findWhereType<T>[] = fval as any[];
      switch (fkey) {
        case "AND":
          return fvalWheres.every((_val) => wheresLoop(_val as WheresEntriesType));
        case "OR":
          return fvalWheres.some((_val) => wheresLoop(_val as WheresEntriesType));
        case "NOT":
          return !fvalWheres.some((_val) => wheresLoop(_val as WheresEntriesType));
        default:
          const _value: any = value;
          const cval = _value[fkey];
          if (typeof fval === "object" && Array.isArray(fval)) {
            const conditions: [filterConditionsAllType, any][] = fval;
            return conditions.every(([k, v]) => {
              const typeName = typeof cval;
              switch (k) {
                case "equals":
                  if (typeName === "string") return String(cval).toLocaleLowerCase() === v;
                  else return cval == v;
                case "not":
                  return cval != v;
                case "like":
                case "contains":
                  if (Array.isArray(cval)) return cval.some((x) => x.toLocaleLowerCase() === v);
                  else {
                    const _v = String(cval).toLocaleLowerCase();
                    if (/[\*\?]/.test(v)) {
                      try { return _v.match(v) } catch { return true }
                    } else return _v.includes(v);
                  }
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
                  if (Array.isArray(cval)) return inVal.some(v => cval.some(c => v == c));
                  else return inVal.some(v => v == cval);
                case "between":
                  const betweenVal = v as any[];
                  return betweenVal[0] <= cval && cval <= betweenVal[1];
                case "bool":
                  let boolVal: boolean;
                  if (Array.isArray(cval)) boolVal = cval.length > 0;
                  else boolVal = Boolean(cval);
                  return v ? boolVal : !boolVal;
                case "regexp":
                  return (v as RegExp).test(cval);
                default:
                  return cval ? compareWheres(cval, [[k, v]]) : false;
              }
            });
          } else {
            return cval == fval;
          }
      }
    });
  }
  return wheres ? wheresLoop(wheres) : true;
}

type CommonCondition = filterConditionsAllKeyValue<any, unknown>;

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

function SplitPeriodKey(key: string, value: any) {
  const parts = key.split(".");
  const partsLength = parts.length - 1;
  const returnValue = {};
  parts.reduce<any>((a, c, i) => {
    if (partsLength === i) {
      a[c] = value;
    } else {
      a[c] = {};
      return a[c];
    }
  }, returnValue);
  return returnValue;
}

function TextToWhere(rawValue: string, value: string, forceContains?: boolean): filterConditionsAllKeyValue<any, unknown> {
  if (forceContains) return { contains: value };
  else {
    const m = rawValue.match(/^\/(.+)\/(\w*)$/);
    if (m) {
      return { regexp: new RegExp(m[1], m[2]) };
    } else {
      return { contains: value };
    }
  }
}

export function setWhere<T = any>(q: string = "", options: WhereOptionsKvType<T> = {}) {
  const textKey = getKeyFromOptions("text", options);
  const fromKey = getKeyFromOptions("from", options);
  const timeKey = getKeyFromOptions("time", options);
  const hashtagKey = options.hashtag?.key ? Array.isArray(options.hashtag.key) ? options.hashtag.key : [options.hashtag.key] : null;
  const hashtagTextKey = options.hashtag?.textKey ? Array.isArray(options.hashtag.textKey) ? options.hashtag.textKey : [options.hashtag.textKey] : null;
  const kanaReplace = options.kanaReplace ?? false;
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
      let NOT = item.startsWith("-");
      if (NOT) item = item.slice(1);
      if (item.length > 1 && item.startsWith("#")) {
        const filterValue = item.slice(1).toLocaleLowerCase();
        const whereHashtags: findWhereWithConditionsType<any>[] = [];
        hashtagKey?.forEach(k => {
          whereHashtags.push({
            [k]: {
              contains: filterValue
            } as CommonCondition
          })
        })
        hashtagTextKey?.forEach(k => {
          whereHashtags.push({
            [k]: {
              regexp: new RegExp(
                `#${filterValue.replace(/(\+)/g, "\\$1")}(\\s|$)`,
                "i"
              )
            } as CommonCondition
          })
        })
        if (whereHashtags.length > 0) {
          whereItem = { OR: whereHashtags };
        }
      } else {
        const colonIndex = /^\w+:\/\//.test(item) ? -1 : item.indexOf(":");
        const switchKey = colonIndex >= 0 ? item.slice(0, colonIndex).toLocaleLowerCase() : "";
        const UNDER = switchKey.startsWith("_");
        let filterKey = UNDER ? switchKey.slice(1) : switchKey;
        let rawFilterValue = switchKey.length > 0 ? item.slice(switchKey.length + 1) : item;
        filterKey = filterKey.replace(/"([^"]+)"/g, (m, m1) => doubleQuoteDic[m1]);
        rawFilterValue = rawFilterValue.replace(/"([^"]+)"/g, (m, m1) => doubleQuoteDic[m1]);
        let filterValue = rawFilterValue.toLocaleLowerCase();
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
              whereItem = whereFromKey(textKey, TextToWhere(rawFilterValue, filterValue, options.forceContains));
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
            let sortValue: OrderByType;
            switch (sortKey.slice(sortKey.lastIndexOf(".") + 1)) {
              case "date":
              case "update":
              case "count":
                sortValue = sortOrder ? "asc" : "desc";
                break;
              default:
                sortValue = sortOrder ? "desc" : "asc";
                break;
            }
            orderBy.push(SplitPeriodKey(sortKey, sortValue));
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
              const keyraw = filterOptions.key || filterKey;
              const key = Array.isArray(keyraw) ? keyraw.map(v => String(v)) : String(keyraw);
              let filterEntry: filterConditionsAllKeyValue<any>;
              if (typeof key === "string" && /\./.test(key)) {
                whereItem = SplitPeriodKey(key, filterValue);
              } else {
                switch (filterValue) {
                  case "true":
                  case "false":
                    const bool = filterValue === "true";
                    if (!bool && filterTake) filterTake = undefined;
                    filterEntry = { bool };
                    break;
                  default:
                    filterEntry = TextToWhere(rawFilterValue, filterValue, options.forceContains);
                    break;
                }
                whereItem = whereFromKey(key, filterEntry);
              }
            }
            break;
        }
        if (typeof take !== "number" && typeof filterTake === "number") {
          take = filterTake;
        }
      }
      if (whereItem) {
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
  return { where, id, take, orderBy: orderBy as OrderByItem<T>[] };
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
