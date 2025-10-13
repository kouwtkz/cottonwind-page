export function findMee<T>(
  list: T[],
  {
    where,
    take,
    orderBy,
    skip = 0,
    direction,
    index,
    query
  }: findMeeProps<T>): T[] {
  let unique: keyof T | undefined;
  if (index) {
    if (query) {
      const AND: findWhereType<T>[] = [];
      if (where) AND.push(where);
      where = { AND };
      if (typeof query === "object" && "lowerOpen" in query) {
        if (query.lower === query.upper) {
          AND.push({ [index]: query })
        } else {
          if (typeof query.lower !== "undefined") {
            AND.push({ [index]: { [query.lowerOpen ? "lt" : "lte"]: query } });
          }
          if (typeof query.upper !== "undefined") {
            AND.push({ [index]: { [query.upperOpen ? "gt" : "gte"]: query } });
          }
        }
      } else {
        AND.push({ [index]: query })
      }
    }
    if (direction) {
      if (!orderBy) orderBy = [];
      orderBy.unshift({ [index]: (direction.startsWith("next") ? "asc" : "desc") } as OrderByItem<T>)
      if (direction.endsWith("unique")) {
        unique = index;
      }
    }
  }
  if (orderBy) findMeeSort({ orderBy, list });
  let i = 0;
  const uniqueMap = new Map<any, void>();
  return list.filter((value) => {
    if (take !== undefined && i >= take + skip) return false;
    const notUnique = unique ? !uniqueMap.has(value[unique]) : true;
    const result = notUnique && findMeeWheresFilter(value, where);
    if (result) {
      i++;
      if (unique && result) {
        uniqueMap.set(value[unique]);
      }
    }
    return result && i > skip;
  });
}

export function findMeeSort<T>({ orderBy, list }: findMeeSortProps<T>) {
  orderBy.reduce<{ [k: string]: OrderByType }[]>((a, c) => {
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
}

function parseEntryKeys(o: any) {
  const r: (string | number)[][] = [];
  function rdf(o: Object, ca: (string | number)[] = []) {
    if (!o) return;
    (Array.isArray(o) ? o.map((v, i) => [i, v]) : Object.entries(o)).forEach(([k, v]) => {
      if (typeof v === "object") {
        rdf(v, ca.concat(k))
      } else {
        r.push(ca.concat(k));
      }
    }, []);
  }
  rdf(o);
  return r;
}
function fromEntryKeys(object: any, keys: (string | number)[]) {
  return keys.reduce<any>((a, c) => {
    if (a) {
      if (c in a) {
        return a[c];
      } else {
        return;
      }
    } else return a;
  }, object);
}

interface WheresFilterOptions {
  key?: string;
  kanaReplace?: boolean;
}
const isObjectExp = /^\[object .+\]$/;
export function findMeeWheresFilter<T>(value: T, where?: findWhereOrConditionsType<T>): boolean {
  function wheresLoop(innerValue: any, innerWhere: findWhereOrConditionsType<T>, { kanaReplace, key }: WheresFilterOptions = {}): boolean {
    if ("kanaReplace" in innerWhere) {
      innerWhere = { ...innerWhere };
      if ("kanaReplace" in innerWhere) {
        kanaReplace = innerWhere.kanaReplace;
        delete innerWhere.kanaReplace;
      }
    }
    const wheres = Object.entries(innerWhere);
    if (wheres.length === 0) {
      return true;
    } else return wheres.every(([fkey, fval]) => {
      if ((fkey === "AND" || fkey === "OR" || fkey === "NOT")) {
        if (Array.isArray(fval)) {
          switch (fkey) {
            case "AND":
              return fval.every((_val) => {
                return wheresLoop(innerValue, _val);
              });
            case "OR":
              return fval.some((_val) => wheresLoop(innerValue, _val));
            case "NOT":
              return !fval.some((_val) => wheresLoop(innerValue, _val));
          }
        } else {
          if (fkey === "NOT") {
            return !wheresLoop(innerValue, fval);
          } else {
            return wheresLoop(innerValue, fval);
          }
        }
      }
      if (fval && typeof fval === "object" && isObjectExp.test(fval.toString())) {
        const nextInnerValue = innerValue && typeof innerValue === "object" ? innerValue[fkey] : innerValue;
        return wheresLoop(nextInnerValue, fval, { kanaReplace, key: fkey });
      } else {
        return findMeeWheresInnerSwitch(innerValue, fkey, fval, { kanaReplace, key });
      }
    });
  }
  return where ? wheresLoop(value, where) : true;
}

export function findMeeWheresInnerSwitch(innerValue: any, fkey: string, fval: any, { kanaReplace, key }: WheresFilterOptions = {}) {
  if (typeof (fval) === "number") {
    const innerValueType = typeof innerValue;
    if (innerValueType === "string" || Array.isArray(innerValue)) {
      innerValue = innerValue.length;
    } else if (!innerValue || innerValueType !== "object") {
      innerValue = Number(innerValue || 0);
    }
  }
  if (kanaReplace && innerValue) {
    fval = kanaToHira(fval);
    innerValue = Array.isArray(innerValue) ? innerValue.map(v => kanaToHira(v)) : kanaToHira(innerValue);
  }
  const innerValueType = typeof innerValue;
  switch (fkey) {
    case "equals":
      if (innerValueType === "string") return String(innerValue).toLocaleLowerCase() === fval;
      else return innerValue == fval;
    case "has":
      return Boolean(innerValue) === fval;
    case "not":
      return innerValue != fval;
    case "like":
    case "contains":
      if (Array.isArray(innerValue)) {
        const fvalL = fval.toLocaleLowerCase();
        return innerValue.some((x) => {
          return x.toLocaleLowerCase() === fvalL;
        });
      }
      else {
        const _v = String(innerValue || null).toLocaleLowerCase();
        if (_v === "null") return fval === _v;
        else if (/[\*\?]/.test(fval)) {
          try { return _v.match(fval) } catch { return true }
        } else return _v.includes(fval);
      }
    case "startsWith":
      return String(innerValue).toLocaleLowerCase().startsWith(fval);
    case "endsWith":
      return String(innerValue).toLocaleLowerCase().endsWith(fval);
    case "gt":
      return innerValue > fval;
    case "gte":
      return innerValue >= fval;
    case "lt":
      return innerValue < fval;
    case "lte":
      return innerValue <= fval;
    case "in":
    case "some":
    case "every": {
      const inVal = (fval as unknown[]).map(v => typeof v === "string" ? v.toLowerCase() : v);
      if (Array.isArray(innerValue)) {
        if (fkey === "every") return inVal.every(v => innerValue.some(c => v == c));
        else return inVal.some(v => innerValue.some(c => v == c));
      }
      else return inVal.some(v => v == innerValue);
    }
    case "between":
      const betweenVal = fval as any[];
      return betweenVal[0] <= innerValue && innerValue <= betweenVal[1];
    case "bool":
      let boolVal: boolean;
      if (Array.isArray(innerValue)) boolVal = innerValue.length > 0;
      else boolVal = Boolean(innerValue);
      return fval ? boolVal : !boolVal;
    case "regexp":
      return (fval as RegExp).test(innerValue);
    default:
      let switchInnerValue = innerValue;
      if (innerValue && innerValueType === "object" && isObjectExp.test(innerValue.toString())) {
        switchInnerValue = innerValue[fkey];
      }
      return switchInnerValue == fval
  }
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

interface WhereFromKeyOptions {
  kanaReplace?: true | Map<any, any>;
}

function whereFromKey(
  key: string | string[],
  value: findWhereType<any>,
  { kanaReplace }: WhereFromKeyOptions = {}
): findWhereType<any> {
  function nestCheck(key: string, value: findWhereType<any>): findWhereType<any> {
    const splitKeys = key.split(".");
    if (splitKeys.length > 1) {
      return splitKeys.sort(() => -1).reduce<findWhereType<any>>((value, key) => {
        return { [key]: value };
      }, value);
    } else {
      return { [key]: value };
    }
  }
  if (Array.isArray(key)) {
    return {
      OR: key.map((k) => {
        if (kanaReplace === true || kanaReplace?.has(k)) {
          value = { ...value, kanaReplace: true };
        }
        return nestCheck(k, value);
      })
    };
  } else {
    return nestCheck(key, value);
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

interface TextToWhereProps {
  rawValue: string; value: string; switchKey?: string; operator?: string; forceContains?: boolean;
}
function TextToWhere({ rawValue, value: strValue, switchKey, operator, forceContains }: TextToWhereProps): filterConditionsAllKeyValue<any, unknown> {
  if (forceContains) return { contains: strValue };
  else {
    const m = rawValue.match(/^\/(.+)\/(\w*)$/);
    if (m) {
      return { regexp: new RegExp(m[1], m[2]) };
    } else {
      switch (rawValue) {
        case "null":
          return { equals: null };
        case "undefined":
          return { equals: undefined };
        default:
          let value: any = strValue;
          if (switchKey && /\d/.test(value)) {
            const num = Number(value);
            if (isNaN(num)) {
              const date = new Date(value);
              if (!isNaN(date.getTime())) value = date;
            } else value = num;
          }
          switch (operator) {
            case ">":
              return { gt: value };
            case "<":
              return { lt: value };
            case ">=":
              return { gte: value };
            case "<=":
              return { lte: value };
            default: {
              const str = String(value);
              const m = str.match(/^\[(.*)\]$/);
              const s = (m ? m[1] : str).split(",")
              if (s.length > 1) {
                if (m) return { every: s };
                else return { some: s }
              } else return { contains: value };
            }
          }
      }
    }
  }
}

export function setWhere<T = any>(q: string = "", options: WhereOptionsKvType<T> = {}) {
  const textKey = getKeyFromOptions("text", options);
  const fromKey = getKeyFromOptions("from", options);
  const timeKey = getKeyFromOptions("time", options);
  const hashtagKey = options.hashtag?.key ? Array.isArray(options.hashtag.key) ? options.hashtag.key : [options.hashtag.key] : null;
  const hashtagTextKey = options.hashtag?.textKey ? Array.isArray(options.hashtag.textKey) ? options.hashtag.textKey : [options.hashtag.textKey] : null;
  const allKanaReplace = options.kanaReplace === true;
  const kanaReplaceArray = typeof options.kanaReplace === "string" ? [options.kanaReplace] : Array.isArray(options.kanaReplace) ? options.kanaReplace : [];
  const kanaReplaceMap = new Map<KeyOfT<T>, boolean>(kanaReplaceArray.map(v => { return [v, true] }));
  const kanaReplace = allKanaReplace || kanaReplaceMap;
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
    if (allKanaReplace === true) m1 = kanaToHira(m1);
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
        const operatorMatch = /^\w+:\/\//.test(item) ? null : item.match(/:|>=?|<=?/);
        const operator = operatorMatch?.[0] || "";
        const operatorIndex = operatorMatch ? operatorMatch.index! : -1;
        const switchKey = operatorIndex >= 0 ? item.slice(0, operatorIndex).toLocaleLowerCase() : "";
        const UNDER = switchKey.startsWith("_");
        let filterKey = UNDER ? switchKey.slice(1) : switchKey;
        let rawFilterValue = switchKey.length > 0 ? item.slice(switchKey.length + operator.length) : item;
        filterKey = filterKey.replace(/"([^"]+)"/g, (m, m1) => doubleQuoteDic[m1]);
        rawFilterValue = rawFilterValue.replace(/"([^"]+)"/g, (m, m1) => doubleQuoteDic[m1]);
        let filterValue = rawFilterValue.toLocaleLowerCase();
        if (allKanaReplace) filterValue = kanaToHira(filterValue);
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
              whereItem = whereFromKey(textKey, TextToWhere({ ...options, rawValue: rawFilterValue, value: filterValue, switchKey, operator }), { kanaReplace });
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
              whereItem = filterOptions.where(filterValue, operator);
            } else {
              const keyraw = filterOptions.key || filterKey;
              const key = Array.isArray(keyraw) ? keyraw.map(v => String(v)) : String(keyraw);
              let filterEntry: filterConditionsAllKeyValue<any>;
              switch (filterValue) {
                case "true":
                case "false":
                  const bool = filterValue === "true";
                  if (!bool && filterTake) filterTake = undefined;
                  filterEntry = { bool };
                  break;
                default:
                  filterEntry = TextToWhere({ ...options, rawValue: rawFilterValue, value: filterValue, switchKey, operator });
                  break;
              }
              if (typeof key === "string" && /\./.test(key)) {
                whereItem = SplitPeriodKey(key, filterEntry);
              } else {
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
