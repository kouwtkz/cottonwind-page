type logicalConditionsType = "AND" | "OR";
type filterConditionsStringType = "contains" | "startsWith" | "endsWith";
type filterConditionsType = "equals" | "gt" | "gte" | "lt" | "lte" | "not" | "in";
type objectSubmitDataType<T> = { [K in keyof T]?: T[K] | { [C in filterConditionsType]?: T[K] } | { [C in filterConditionsStringType]?: string } }
type findWhereType<T> = { [K in logicalConditionsType]?: (findWhereType<T> | objectSubmitDataType<T>)[] } | objectSubmitDataType<T>
// includeは無理…それ以外を再現した
type findManyProps<T> = {
  list?: T[],
  where?: findWhereType<T>;
  take?: number,
  skip?: number,
  orderBy?: { [K in keyof T]?: "asc" | "desc" }[],
  include?: any
}
