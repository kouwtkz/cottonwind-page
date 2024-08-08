import { AutoAllotDate } from "./DateFunctions";

export function findMany<T>({
  list,
  where,
  take,
  orderBy,
  skip = 0,
}: findManyProps<T>): T[] {
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
    .reverse()
    .forEach((args) => {
      Object.entries(args).forEach(([k, v]) => {
        switch (v) {
          case "asc":
            list.sort((a: any, b: any) =>
              a[k] < b[k] ? -1 : a[k] > b[k] ? 1 : 0
            );
            break;
          case "desc":
            list.sort((a: any, b: any) =>
              a[k] < b[k] ? 1 : a[k] > b[k] ? -1 : 0
            );
            break;
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

function createFilterEntry(
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

function getKeyFromOptions<T>(key: string, options: WhereOptionsKvType<T>): (string | string[]) {
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

export function setWhere<T>(q: string, options: WhereOptionsKvType<T> = {}) {
  const textKey = getKeyFromOptions("text", options);
  const fromKey = getKeyFromOptions("from", options);
  const dateKey = getKeyFromOptions("date", options);
  const hashtagKey = options.hashtag?.key ?? "hashtag";
  const enableHashtagKey = options.hashtag?.enableKey ?? true;
  const enableHashtagText = options.hashtag?.enableText ?? false;
  const whereList: findWhereType<any>[] = [];
  let id: number | undefined;
  let take: number | undefined;
  const orderBy: OrderByItem[] = [];
  let OR = false;
  const searchArray = (q ?? "").replace(/^\s+|\s+$/, "").split(/\s+/);
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
        const filterKey = UNDER ? switchKey.slice(1) : switchKey;
        const filterValue = item.slice(switchKey.length + 1);
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
              whereItem = whereFromKey(textKey, createFilterEntry(item));
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
                Array.isArray(dateKey) ? dateKey : [dateKey].forEach((k) => {
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
            whereItem = whereFromKey(dateKey, {
              gte: AutoAllotDate({
                value: String(filterValue),
                dayFirst: true,
              }),
            });
            break;
          case "until":
            whereItem = whereFromKey(dateKey, {
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
                  filterEntry = createFilterEntry(filterValue);
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
        if (NOT) whereItem = { NOT: [whereItem] }
        whereList.push(whereItem);
      }
      if (OR) {
        const current = whereList.pop();
        const before = whereList.pop();
        if (before?.OR) {
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
  const where = whereList.length > 1 ? { AND: whereList } : (whereList[0] ?? {});
  return { where, id, take, orderBy };
}
