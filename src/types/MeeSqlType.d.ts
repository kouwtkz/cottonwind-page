interface MeeSqlSelectProps<T = any> {
  table: string;
  params?: "*" | keyof T | (keyof T)[];
  where?: findWhereType<T>;
  orderBy?: OrderByItem<T> | OrderByItem<T>[];
  take?: number,
  skip?: number,
};

interface MeeSqlInsertProps<T = any> {
  table: string;
  entry?: T,
  rawEntry?: T,
};

interface MeeSqlUpdateProps<T = any> {
  table: string;
  entry?: T,
  rawEntry?: T,
  where?: findWhereType<T>;
  take?: number,
  skip?: number,
};

interface MeeSqlDeleteProps<T = any> {
  table: string;
  where?: findWhereType<T>;
  take?: number,
  skip?: number,
};

type sqliteValueType = "TEXT" | "NUMERIC" | "INTEGER" | "REAL" | "";
interface MeeSqlCreateTableEntryItemType {
  default?: any;
  type?: sqliteValueType;
  primary?: boolean;
  unique?: boolean;
  notNull?: boolean;
  createAt?: boolean;
}
type MeeSqlCreateTableEntryType<T = any> = {
  [k in keyof T]: MeeSqlCreateTableEntryItemType
}
interface MeeSqlCreateProps<T = any> {
  table: string;
  notExists?: boolean;
  entry: MeeSqlCreateTableEntryType<T>;
};

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
