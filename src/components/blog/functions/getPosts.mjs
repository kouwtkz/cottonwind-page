// @ts-check

import { AutoAllotDate } from "../../doc/DateFunctions.mjs";
import { findMany } from "./findMany.mjs";

/**
 * @typedef 
 * {{
 *  posts: Post[]
 *  update?: boolean
 *  take?: number
 *  page?: number
 *  q?: string
 *  common?: boolean
 *  pinned?: boolean
 * }} getPostsProps
 */

/** @param {getPostsProps} args */
export default function getPosts({ posts, take, page, common, q = "", pinned = false }) {
  if (page) page--;
  const skip = (take && page) ? take * page : 0;
  const options = {};

  const where = setWhere(q, options);
  if (common) where.push(
    { draft: false, date: { lte: new Date() } }
  )
  /** @type any[] */
  const orderBy = []
  if (pinned) orderBy.push({ pin: "desc" })
  orderBy.push({ date: "desc" })

  try {
    /** @type Post[] */
    let postsResult = findMany({
      list: posts,
      where: {
        AND: where,
      },
      orderBy,
    });
    const count = postsResult.length;
    postsResult = postsResult.filter((post, i) => {
      if (take !== undefined && i >= (take + skip)) return false;
      return ++i > skip;
    })
    const max = Math.ceil(count / (take || count));
    return { posts: postsResult, count, max };
  } catch (e) {
    console.log(e);
    return { posts: [], count: 0, max: 0 }
  }
}

/**
 * @typedef 
 * {{
 *  hidden?: {
 *    draft?: boolean
 *  };
 * }} WhereOptionsType
 */

/**
 * @param {string} q
 * @param {WhereOptionsType} options
 */
function setWhere(q, options) {
  const hiddenOption = options.hidden || { draft: false }
  /** @type any[] */
  const where = [];
  let OR = false, OR_skip = false;
  const searchArray = q.replace(/^\s+|\s+$/, "").split(/\s+/);
  searchArray.forEach((item) => {
    if (item === "OR") {
      OR = true;
      OR_skip = true;
    }
    else if (item.slice(0, 1) === "#") {
      const filterValue = item.slice(1);
      where.push({
        OR: [{
          category: {
            contains: filterValue
          }
        }, {
          body: {
            contains: new RegExp(`#${filterValue}(\\s|$)`, "i")
          }
        }]
      })
    } else {
      const filterKey = item.slice(0, item.indexOf(":"));
      const filterValue = item.slice(filterKey.length + 1);
      switch (filterKey) {
        case "title":
        case "body":
          where.push(
            {
              [filterKey]: {
                contains: filterValue
              }
            })
          break;
        case "cat":
        case "category":
          where.push(
            {
              category: {
                contains: filterValue
              }
            })
          break;
        case "tag":
        case "hashtag":
          where.push(
            {
              body: {
                contains: `#${filterValue}`
              }
            })
          break;
        case 'user':
          where.push(
            {
              user: {
                name: {
                  contains: filterValue
                }
              }
            })
          break;
        case 'from':
          where.push(
            {
              userId: {
                equals: filterValue
              }
            })
          break;
        case 'since':
          where.push(
            {
              date: { gte: AutoAllotDate({ value: String(filterValue), dayFirst: true }) }
            })
          break;
        case 'until':
          where.push(
            {
              date: { lte: AutoAllotDate({ value: String(filterValue), dayLast: true }) }
            })
          break;
        case 'filter':
        case 'has':
          switch (filterValue.toLowerCase()) {
            case "media":
            case "images":
              where.push(
                {
                  body: {
                    contains: "![%](%)"
                  }
                })
              break;
            case "publish":
              where.push(
                {
                  draft: {
                    equals: false
                  }
                })
              break;
            case "draft":
              where.push(
                {
                  draft: {
                    equals: true
                  }
                })
              break;
            case "pinned":
              where.push(
                {
                  pin: {
                    gt: 0
                  }
                })
              break;
            case "no-pinned":
              where.push(
                {
                  pin: {
                    equals: 0
                  }
                })
              break;
            case "secret-pinned":
              where.push(
                {
                  pin: {
                    lt: 0
                  }
                })
              break;
            case "default":
              hiddenOption.draft = true;
              where.push(
                {
                  AND: [
                    {
                      draft: {
                        equals: false
                      },
                    }
                  ]
                })
              break;
          }
          break;
        default:
          where.push(
            {
              body: {
                contains: item
              }
            })
          break;
      }
    }
    if (OR_skip) {
      OR_skip = false;
    } else if (OR) {
      const current = where.pop();
      const before = where.pop();
      if (before.OR) {
        before.OR.push(current);
        where.push(before);
      } else {
        where.push({
          OR: [
            before,
            current
          ]
        })
      }
      OR = false;
    }
  })
  options.hidden = hiddenOption;
  return where;
}