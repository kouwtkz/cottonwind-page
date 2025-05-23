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

interface KeyValueType<T = unknown> {
  [k: string]: T;
}

type OrNull<T> = T | null;

interface Vector {
  x: number;
  y: number;
}
