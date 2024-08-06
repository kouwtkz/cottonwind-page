type logicalConditionsType = "AND" | "OR" | "NOT";
type filterConditionsType = "equals" | "gt" | "gte" | "lt" | "lte" | "not" | "in";
type filterConditionsStringType = "contains" | "startsWith" | "endsWith";
type filterConditionsBoolType = "bool";
type filterConditionsAllType = filterConditionsType | filterConditionsStringType | filterConditionsBoolType;
type filterConditionsBoolStringKeyValue = { [C in filterConditionsStringType]?: string } | { [C in filterConditionsBoolType]?: boolean };
type filterConditionsAllKeyValue<T> = { [C in filterConditionsType]?: T[K] } | filterConditionsBoolStringKeyValue;
type objectSubmitDataType<T> = { [K in keyof T]?: T[K] | filterConditionsAllKeyValue<T> };
type findWhereType<T> = { [K in logicalConditionsType]?: (findWhereType<T> | objectSubmitDataType<T>)[] } | objectSubmitDataType<T>;
type findWhereWithConditionsType<T> = findWhereType<T> | filterConditionsAllType;

// includeは無理…それ以外を再現した
type findManyProps<T> = {
  list?: T[],
  where?: findWhereType<T>;
  take?: number,
  skip?: number,
  orderBy?: { [K in keyof T]?: OrderByType }[],
  include?: any
}
type OrderByType = "asc" | "desc";
type OrderByItem = { [k: string]: OrderByType };

type findWhereFunction<T> = (v: string) => findWhereType<T>;

interface WhereOptionsType<T> {
  key?: string | string[];
  where?: findWhereFunction<T>;
  take?: number;
  hidden?: boolean;
  [k: string]: any;
}

interface WhereOptionsHashtagType {
  key?: string | string[];
  enableText?: boolean;
  enableKey?: boolean;
  [k: string]: any;
}

interface WhereOptionsKvType<T> {
  hashtag?: WhereOptionsHashtagType;
  [k: string]: string
  | findWhereFunction<T>
  | WhereOptionsType<T>;
};
