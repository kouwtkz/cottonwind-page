import SqlString from "tsqlstring";

export class MeeSqlClass<T> {
  db: MeeSqlDBProps & T;
  constructor(db: T) {
    this.db = db as MeeSqlDBProps & T;
  }
  static sqlWhere<K>(where?: findWhereType<K>) {
    const sqlObject = where ? whereToSql<K>(where) : null;
    let sql = "";
    if (sqlObject?.where) sql = sql + sqlObject.where;
    return { sql, bind: sqlObject?.bind ?? [] }
  }
  static selectBindSQL<K, L = string>({ params = "*", table, orderBy, where, take, skip, viewSql }: MeeSqlSelectProps<K>) {
    const param = (Array.isArray(params) ? params : [params])
      .reduce((a, f) => {
        (typeof f === "object" ? Object.entries(f) : [[f, null]])
          .forEach(([k, v]) => {
            const field = k as string;
            let sql = field === "*" || /[\("']/.test(field) ? field : ("`" + field + "`");
            const As = v as L;
            if (As) sql = sql + ` AS \`${As}\``;
            a.push(sql);
          })
        return a;
      }, [] as string[])
      .join(", ");
    let { sql, bind = [] } = MeeSqlClass.sqlWhere(where);
    sql = `SELECT ${param} FROM \`${table}\`` + sql;
    if (orderBy) {
      const orderByList =
        (Array.isArray(orderBy) ? orderBy : [orderBy])
          ?.reduce((a, c) => {
            Object.entries(c).forEach(([k, v]) => {
              if (a.findIndex((f) => k in f) < 0) {
                if (c) a.push({ [k]: v as OrderByType });
              }
            });
            return a;
          }, [] as { [k: string]: OrderByType }[]);
      if (orderByList.length) {
        sql = sql + " ORDER BY "
          + orderByList.map(e => {
            const [k, v] = Object.entries(e)[0];
            return `\`${k}\` ` + v.toUpperCase();
          }).join(", ");
      }
    }
    if (take) sql = sql + " LIMIT " + take + (skip ? (" OFFSET " + skip) : "");
    if (viewSql) {
      console.log("SQL: ", sql);
      console.log("Bind: ", ...bind);
    }
    return { bind, sql };
  }
  async select<K>(args: MeeSqlSelectProps<K>) {
    const { bind, sql } = MeeSqlClass.selectBindSQL(args)
    const stmt = this.db.prepare(sql);
    return stmt.bind(...bind).all() as K[];
  }
  async insert<K extends Object>({ table, entry, rawEntry = {} as K, viewSql }: MeeSqlInsertProps<K>) {
    const entries = Object.entries(entry ?? {}).filter(v => v[1] !== undefined);
    const rawEntries = Object.entries(rawEntry).filter(v => v[1] !== undefined);
    const keys = entries.map((v) => `\`${v[0]}\``).concat(rawEntries.map((v) => `\`${v[0]}\``));
    const values = entries.map(() => "?").concat(rawEntries.map((v) => v[1]));
    let sql = `INSERT INTO \`${table}\` ` + (keys.length > 0 ? `(${keys.join(", ")}) VALUES (${values.join(", ")})` : "DEFAULT VALUES");
    const bind = entries.map((v) => v[1]);
    if (viewSql) {
      console.log("SQL: ", sql);
      console.log("Bind: ", ...bind);
    }
    const stmt = this.db.prepare(sql);
    return stmt.bind(...bind).run();
  }
  static insertSQL<K extends Object>({ table, entry }: Omit<MeeSqlInsertProps<K>, "rawEntry" | "viewSql">) {
    const entries = Object.entries(entry ?? {}).filter(v => v[1] !== undefined);
    const keys = entries.map((v) => `\`${v[0]}\``);
    const values = entries.map(() => "?");
    let sql = `INSERT INTO \`${table}\` ` + (keys.length > 0 ? `(${keys.join(", ")}) VALUES (${values.join(", ")})` : "DEFAULT VALUES");
    const bind = entries.map((v) => v[1]);
    return SqlString.format(sql, bind, false)
      .replaceAll("\\r", "'||char(13)||'").replaceAll("\\n", "'||char(10)||'").replaceAll("||''||", "||");
  }
  async insertSelect<K extends Object, L = string>({ params = "*", table, from, viewSql, ...args }: MeeSqlInsertSelectProps<K>) {
    let sql = `INSERT INTO \`${table}\` `;
    const { sql: selectSql, bind } = MeeSqlClass.selectBindSQL<K>({ params, table: from, ...args });
    if (params !== "*") {
      const asList = (Array.isArray(params) ? params : [params])
        .reduce((a, f) => {
          (typeof f === "object" ? Object.entries(f) : [[f, null]])
            .forEach(([k, v]) => { a.push(v ?? k) })
          return a;
        }, [] as L[]);
      if (asList.length > 0) sql = sql + `(${asList.map(v => `\`${v}\``).join(", ")}) `;
    }
    sql = sql + selectSql;
    if (viewSql) {
      console.log("SQL: ", sql);
      console.log("Bind: ", ...bind);
    }
    const stmt = this.db.prepare(sql);
    return stmt.bind(...bind).run();
  }
  async update<K extends Object>({ table, entry, rawEntry = {} as K, where, take, skip, viewSql }: MeeSqlUpdateProps<K>) {
    const entries = Object.entries(entry ?? {}).filter(v => v[1] !== undefined);
    const rawEntries = Object.entries(rawEntry).filter(v => v[1] !== undefined).map((v) => `\`${v[0]}\` = ${v[1]}`);
    let sql = `UPDATE \`${table}\` SET ` + entries.map((v) => `\`${v[0]}\` = ?`).concat(rawEntries).join(", ");
    const { sql: whereSql, bind: whereBind } = MeeSqlClass.sqlWhere(where);
    if (whereSql) sql = sql + whereSql;
    if (take) sql = sql + " LIMIT " + take + (skip ? (" OFFSET " + skip) : "");
    const bind = entries.map((v) => v[1]).concat(whereBind);
    if (viewSql) {
      console.log("SQL: ", sql);
      console.log("Bind: ", ...bind);
    }
    const stmt = this.db.prepare(sql);
    return stmt.bind(...bind).run();
  }
  async delete<K>({ table, where, take, skip, viewSql }: MeeSqlDeleteProps<K>) {
    let { sql, bind = [] } = MeeSqlClass.sqlWhere(where);
    sql = "DELETE FROM `" + table + "`" + sql;
    if (take) sql = sql + " LIMIT " + take + (skip ? (" OFFSET " + skip) : "");
    if (viewSql) {
      console.log("SQL: ", sql);
      console.log("Bind: ", ...bind);
    }
    const stmt = this.db.prepare(sql);
    return stmt.bind(...bind).run();
  }
  static fillNullEntry<K>(entry: MeeSqlCreateTableEntryType<K>) {
    type keyK = keyof K;
    const nullEntry: { [k in keyK]?: unknown | null } = {};
    Object.entries(entry).forEach(([k, _v]) => {
      const v: MeeSqlCreateTableEntryItemType<K> = (_v && typeof _v === "object") ? _v : { default: _v };
      if (!v.notNull && !v.createAt && !v.primary) {
        nullEntry[k as keyK] = null;
      }
    })
    return nullEntry;
  }
  static isoFormat(time = "'now'") { return `strftime('%Y-%m-%dT%H:%M:%fZ', ${time})` };
  async createTable<K = any>({ table, notExists, entry, withoutRowid, indexName, viewSql }: MeeSqlCreateTableProps<K>) {
    let sql = "CREATE TABLE";
    if (notExists) sql = sql + " IF NOT EXISTS";
    const primaries: { key: string, autoIncrement?: boolean }[] = [];
    type indexFieldsMapType = { value: keyof K; orderBy?: OrderByType };
    const indexFieldsMap: Map<string, (indexFieldsMapType)[]> = new Map();
    let indexUnique: boolean | undefined = undefined;
    const items = Object.entries(entry).map(([k, _v]) => {
      const v: MeeSqlCreateTableEntryItemType<K> = (_v && typeof _v === "object") ? _v : { default: _v };
      let sql = "`" + k + "`";
      const defaultTypeof = typeof v.default;
      let fieldType: sqliteValueType | undefined = v.type;
      if (typeof fieldType === "undefined") {
        switch (defaultTypeof) {
          case "string":
            fieldType = "TEXT";
            break;
          case "number":
            fieldType = "NUMERIC";
            break;
          case "boolean":
          case "bigint":
            fieldType = "INTEGER";
            break;
          default:
            if (v.createAt) fieldType = "TEXT";
            else if (v.primary) fieldType = "INTEGER";
            else fieldType = "";
        }
      }
      if (v.autoIncrement) fieldType = "INTEGER";
      if (fieldType) sql = sql + " " + fieldType;
      if (v.primary || v.autoIncrement) primaries.push({ key: k, autoIncrement: v.autoIncrement });
      if (typeof v.index) {
        const indexFields: { value: keyof K; orderBy?: OrderByType } = { value: k as keyof K };
        let indexKey: string = "";
        switch (typeof v.index) {
          case "object":
            Object.entries(v.index).slice(0, 1).forEach(([key, v]) => {
              if (v) indexKey = key;
              if (typeof v === "object") {
                indexUnique = v.unique;
                indexFields.orderBy = v.orderBy;
              }
            });
            break;
          case "string":
            indexKey = v.index;
            break;
          default:
            if (v.index) indexKey = indexName || ("INDEX_" + k);
            break;
        }
        if (indexKey && indexFields.value) {
          if (indexFieldsMap.has(indexKey)) indexFieldsMap.get(indexKey)!.push(indexFields);
          else indexFieldsMap.set(indexKey, [indexFields]);
        }
      }
      if (v.createAt) {
        sql = sql + " NOT NULL DEFAULT (" + MeeSqlClass.isoFormat() + ")";
      } else {
        if (v.notNull) sql = sql + " NOT NULL";
        if (defaultTypeof !== "undefined") {
          sql = sql + " DEFAULT " + (fieldType === "TEXT" ? `'${v.default}'` : v.default);
        }
      }
      if (v.unique) sql = sql + " UNIQUE";
      return sql;
    });
    if (primaries.length > 0) {
      items.push("PRIMARY KEY (" + primaries.map(v => {
        let sql = "`" + v.key + "`";
        if (v.autoIncrement) sql = sql + " AUTOINCREMENT";
        return sql;
      }).join(", ") + ")");
    }
    sql = sql + " `" + table + "`(" + items.join(", ") + ")";
    if (withoutRowid) sql = sql + " WITHOUT ROWID";
    if (viewSql) console.log("SQL: ", sql);
    const createTableExec = (async () => this.db.exec(sql))();
    return createTableExec.then(async (v) => {
      if (indexFieldsMap.size > 0) {
        const indexPromiseList: Promise<unknown>[] = [];
        indexFieldsMap.forEach(async (list, indexName) => {
          indexPromiseList.push(this.createIndex({
            table, indexName, unique: indexUnique, fields: list.map((v) => {
              if (v.orderBy) return { [v.value]: v.orderBy };
              else return v.value;
            }) as CreateIndexFieldsType<K>[], viewSql
          }));
        })
        await Promise.all(indexPromiseList);
      }
      return v;
    });
  }
  static createIndexSQL<K = any>({ table, indexName, unique, fields, viewSql }: MeeSqlCreateIndexProps<K>) {
    if (!Array.isArray(fields)) fields = [fields];
    let sql = "CREATE";
    if (unique) sql = sql + " UNIQUE";
    sql = sql + ` INDEX \`${indexName}\` ON \`${table}\``;
    sql = sql + `(${fields.reduce((a, c) => {
      switch (typeof c) {
        case "object":
          Object.keys(c).forEach(k => {
            const orderBy: OrderByType | undefined = c[k as keyof K];
            if (orderBy) a.push(`\`${k}\` ${orderBy.toUpperCase()}`)
          });
          break;
        case "string":
          a.push(`\`${c}\``);
          break;
      }
      return a;
    }, [] as string[]).join(", ")})`;
    if (viewSql) console.log("SQL: ", sql);
    return sql
  }
  async createIndex<K = any>(args: MeeSqlCreateIndexProps<K>) {
    return this.db.exec(MeeSqlClass.createIndexSQL<K>(args));
  }
  async dropTable({ table, viewSql }: MeeSqlBaseProps) {
    const sql = `DROP TABLE \`${table}\``;
    if (viewSql) console.log("SQL: ", sql);
    return this.db.exec(sql);
  }
  async dropIndex({ indexName, viewSql }: MeeSqlDropIndexProps) {
    const sql = `DROP INDEX \`${indexName}\``;
    if (viewSql) console.log("SQL: ", sql);
    return this.db.exec(sql);
  }
  async renameTable({ table, from, viewSql }: MeeSqlRenameTableProps) {
    const sql = `ALTER TABLE \`${from}\` RENAME TO \`${table}\``;
    if (viewSql) console.log("SQL: ", sql);
    return this.db.exec(sql);
  }
}

function whereToSql<T = any>(where: findWhereType<T>) {
  const bind: any[] = [];
  function recursion(__where: findWhereType<T>, not = false, isFirst = false): string {
    let list1 = Object.entries(__where).map(([fkey, fval]) => {
      const field = "`" + fkey + "`";
      switch (fkey) {
        case "AND":
        case "OR":
          const values = (fval as findWhereType<T>[]).map((_val) => recursion(_val, not)).filter(v => v);
          const joined = values.join(` ${fkey} `);
          return (!isFirst && values.length > 1) ? `(${joined})` : joined;
        case "NOT":
          return recursion(fval, true);
        default:
          if (typeof fval === "object") {
            if (fval === null) {
              return `${field} IS ${not ? "NOT " : ""}NULL`;
            } else if ("test" in fval) {
              bind.push((fval as RegExp).source);
              return `${field} ${not ? "NOT " : ""}REGEXP ?`;
            }
            const _conditions: [any, any][] = Object.entries(fval || { equal: fval });
            const conditions: [filterConditionsAllType, any][] = _conditions;
            let list2 = conditions.map(([k, v]) => {
              switch (k) {
                case "not":
                  bind.push(v);
                  return `${field} <> ?`;
                case "contains":
                  bind.push(`%${v}%`);
                  return `${field} LIKE ?`;
                case "startsWith":
                  bind.push(`${v}%`);
                  return `${field} LIKE ?`;
                case "endsWith":
                  bind.push(`%${v}`);
                  return `${field} LIKE ?`;
                case "gt":
                  bind.push(v);
                  return `${field} > ?`;
                case "gte":
                  bind.push(v);
                  return `${field} >= ?`;
                case "lt":
                  bind.push(v);
                  return `${field} < ?`;
                case "lte":
                  bind.push(v);
                  return `${field} <= ?`;
                case "between":
                  const betweenArgs = (v as unknown[]).slice(0, 2);
                  if (betweenArgs.length === 2) {
                    bind.push(...betweenArgs);
                    return `${field} BETWEEN ? AND ?`;
                  } else return;
                case "in":
                  const inList = v as unknown[];
                  inList.forEach((v) => { bind.push(v) });
                  return `${field} IN (${inList.map(() => "?").join(", ")})`;
                case "equals":
                default:
                  bind.push(v);
                  return `${field} = ?`;
              }
            });
            if (not) list2 = list2.map(v => "NOT " + v);
            return list2;
          } else {
            bind.push(fval);
            if (not) return `${field} != ?`;
            else return `${field} = ?`;
          }
      }
    }).filter(v => v);
    return list1.join(" ");
  }
  const whereString = recursion({ AND: Object.entries(where).map(([k, v]) => ({ [k]: v })) }, false, true);
  return { where: whereString ? " WHERE " + whereString : "", bind };
}
