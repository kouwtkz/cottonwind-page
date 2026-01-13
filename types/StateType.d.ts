type setTypeProps<T> =
  | Partial<T>
  | ((prevState: T) => Partial<T> | void);
type setType<T> = (value: setTypeProps<T>) => void;
type WithSet<T> = T & { Set: setType<T> };

type SetStatePartialPropsType<T> = T | Partial<T> | ((state: T) => T | Partial<T>);
type SetStatePropsType<T> = T | ((state: T) => T);
type SetStateType<T> = ((partial: SetStatePartialPropsType<T>, replace?: false) => void) & ((state: SetStatePropsType<T>, replace: true) => void);
