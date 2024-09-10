interface MeeSqlBaseProps {
  table: string;
  viewSql?: boolean;
}

interface SystemSelectType {
  ROWID: number;
}
type T_KeyofType<T> = keyof T;
type T_SelectTypeBase<T> = T & SystemSelectType;
type T_SelectType<T> = T_SelectTypeBase<T> & { [k: string]: unknown };
type T_SelectKeyofType<T> = keyof T_SelectTypeBase<T> | (keyof T_SelectTypeBase<T>)[] | { [k in keyof T_SelectType<T>]?: string };
type SelectParamsType<T> = "*" | T_SelectKeyofType<T>;
type MeeSqlFindWhereType<T> = findWhereType<T_SelectType<T>>;
type MeeSqlOrderByType<T> = OrderByItem<T_SelectType<T>>;

interface MeeSqlSelectProps<T = any> extends MeeSqlBaseProps {
  /** @comment {"key": "as name"} */
  params?: SelectParamsType<T> | SelectParamsType<T>[];
  where?: MeeSqlFindWhereType<MeeSqlCreateTableEntryType<T>>;
  orderBy?: MeeSqlOrderByType<T> | MeeSqlOrderByType<T>[];
  take?: number,
  skip?: number,
};

type MeeSqlEntryType<T> = T | { [k: string]: unknown };
interface MeeSqlInsertProps<T = any> extends MeeSqlBaseProps {
  entry?: MeeSqlEntryType<T>,
  rawEntry?: MeeSqlEntryType<T>,
};
interface MeeSqlInsertSelectProps<T = any> extends MeeSqlSelectProps<T> {
  from: string;
};

interface MeeSqlUpdateProps<T = any> extends MeeSqlBaseProps {
  entry?: MeeSqlEntryType<T>,
  rawEntry?: MeeSqlEntryType<T>,
  where?: MeeSqlFindWhereType<T>;
  take?: number,
  skip?: number,
};

interface MeeSqlDeleteProps<T = any> extends MeeSqlBaseProps {
  where?: MeeSqlFindWhereType<T>;
  take?: number,
  skip?: number,
};

type sqliteValueType = "TEXT" | "NUMERIC" | "INTEGER" | "REAL" | "";
type entryValueType = string | number | boolean | null;
type MeeSqlIndexEntryType = { orderBy?: OrderByType; unique?: boolean };
interface MeeSqlCreateTableEntryItemType<T> {
  default?: entryValueType;
  type?: sqliteValueType;
  primary?: boolean;
  unique?: boolean;
  notNull?: boolean;
  autoIncrement?: boolean;
  createAt?: boolean;
  index?: boolean | string | { [k: string]: (boolean | MeeSqlIndexEntryType) };
}
type MeeSqlCreateTableEntryType<T = any> = {
  [k in keyof T]: MeeSqlCreateTableEntryItemType<T> | entryValueType;
}
interface MeeSqlCreateTableProps<T = any> extends MeeSqlBaseProps {
  notExists?: boolean;
  entry: MeeSqlCreateTableEntryType<T>;
  withoutRowid?: boolean;
  indexName?: string;
}
type CreateIndexFieldsType<T> = T_KeyofType<T> | { [k in T_KeyofType<T>]?: OrderByType };
interface MeeSqlCreateIndexProps<T = any> extends MeeSqlBaseProps {
  indexName: string;
  unique?: boolean;
  fields: CreateIndexFieldsType<T> | CreateIndexFieldsType<T>[];
}
interface MeeSqlDropIndexProps extends Omit<MeeSqlBaseProps, "table"> {
  indexName: string;
}
interface MeeSqlRenameTableProps extends MeeSqlBaseProps {
  from: string;
}

interface MeeSqlDBProps {
  prepare(query: unknown): MeeSqlPrepareState;
  exec(query: string): unknown;
}

interface MeeSqlPrepareState {
  bind(...values: unknown[]): MeeSqlPrepareState;
  run(): unknown;
  all(): unknown;
  [k: string]: unknown;
}
