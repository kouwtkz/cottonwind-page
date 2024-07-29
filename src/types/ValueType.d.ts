interface ValueCountType {
  value: string;
  count: number;
}

interface KeyValueStringType {
  [k: string]: string | undefined;
}

interface KeyValueAnyType {
  [k: string]: any;
}

interface KeyValueType<T> {
  [k: string]: T;
}
