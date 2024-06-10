// @ts-check


/**
 * @template T
 * @param {findManyProps<T>} args
 * @returns T[]
 */
export function findMany({ list, where, take, orderBy, skip = 0 }) {
  if (!list) return [];
  orderBy?.reverse().forEach((args) =>
    Object.entries(args).forEach(([k, v]) => {
      switch (v) {
        case "asc":
          list.sort(
            /** @param {any} a; @param {any} b; */
            (a, b) => a[k] < b[k] ? -1 : a[k] > b[k] ? 1 : 0)
          break;
        case "desc":
          list.sort(
            /** @param {any} a; @param {any} b; */
            (a, b) => a[k] < b[k] ? 1 : a[k] > b[k] ? -1 : 0)
          break;
      }
    })
  );
  let i = 0;
  return list.filter((value) => {
    if (take !== undefined && i >= (take + skip)) return false;
    const result = whereLoop(value, where);
    if (result) i++;
    return result && i > skip;
  })
}

/**
 * @template T
 * @param {T} value
 * @param {findWhereType<T> | undefined} where
 * @returns {boolean}
 */
function whereLoop(value, where) {
  /**
   * @param {findWhereType<T>} __where
   * @returns {boolean}
   */
  const recursion = (__where) => {
    return Object.entries(__where).every(([fkey, fval]) => {
      /** @type {findWhereType<T>[]} */
      const fvalWheres = fval;
      switch (fkey) {
        case "AND":
          return fvalWheres.every((_val) => recursion(_val))
        case "OR":
          return fvalWheres.some((_val) => recursion(_val))
        default:
          /** @type any */ const _value = value;
          const cval = _value[fkey];
          if (typeof (fval) === "object") {
            /** @type {[any, any][]} */
            const _conditions = Object.entries(fval);
            /** @type {[filterConditionsType | filterConditionsStringType, any][]} */
            const conditions = _conditions;
            return (conditions).every(([k, v]) => {
              switch (k) {
                case "equals":
                  return cval == v;
                case "not":
                  return cval != v;
                case "contains":
                  if (Array.isArray(cval)) return cval.some(x => x === v);
                  else if (typeof v === "object" && "test" in v) return v.test(cval);
                  else return String(cval).match(v);
                case "startsWith":
                  return String(cval).startsWith(v);
                case "endsWith":
                  return String(cval).endsWith(v);
                case "gt":
                  return cval > v;
                case "gte":
                  return cval >= v;
                case "lt":
                  return cval < v;
                case "lte":
                  return cval <= v;
                default:
                  return false;
              }
            })
          } else {
            return cval == fval;
          }
      }
    })
  }
  return where ? recursion(where) : true;
}
