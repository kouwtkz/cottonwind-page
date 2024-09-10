type logicalConditionsType = "AND" | "OR";
type logicalNotConditionsType = "NOT";
type filterConditionsType = "equals" | "gt" | "gte" | "lt" | "lte" | "not";
type filterConditionsStringType = "contains" | "startsWith" | "endsWith";
type filterConditionsBoolType = "bool";
type filterConditionsVariadicType = "in" | "between";
type filterConditionsAllType = filterConditionsType | filterConditionsStringType | filterConditionsVariadicType | filterConditionsBoolType;
type filterConditionsBoolStringKeyValue = { [C in filterConditionsStringType]?: string } & { [C in filterConditionsBoolType]?: boolean };
type filterConditionsAllKeyValue<T, K = unknown> = { [C in filterConditionsType]?: T[K] } & { [C in filterConditionsVariadicType]?: T[K][] } & filterConditionsBoolStringKeyValue;
type filterConditionsGenericsAllKeyValue<T> = { [K in keyof T]?: T[K] | filterConditionsAllKeyValue<T, K> };
type objectSubmitDataType<T> = { [K in logicalNotConditionsType]?: findWhereType<T> } | filterConditionsGenericsAllKeyValue<T>;
type findWhereType<T> = { [K in logicalConditionsType]?: (findWhereType<T> | objectSubmitDataType<T>)[] } | objectSubmitDataType<T>;
type findWhereWithConditionsType<T> = findWhereType<T> | filterConditionsAllType;

type OrderByType = "asc" | "desc";
type OrderByKeyStr = { [k: string]: OrderByType };
type OrderByItem<T> = { [K in keyof T]?: OrderByType };

type findMeeProps<T> = {
  list?: T[],
  where?: findWhereType<T>;
  take?: number,
  skip?: number,
  orderBy?: OrderByItem<T>[],
  include?: any
}

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
  kanaReplace?: boolean;
  [k: string]: string
  | findWhereFunction<T>
  | WhereOptionsType<T>;
};
