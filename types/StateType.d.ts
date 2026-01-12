type setTypeProps<T> =
  | Partial<T>
  | ((prevState: T) => Partial<T> | void);
type setType<T> = (value: setTypeProps<T>) => void;
type WithSet<T> = T & { Set: setType<T> };
