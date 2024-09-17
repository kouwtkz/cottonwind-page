type setStateFunction<T> = (args_0: SetStateAction<T[] | undefined>) => void;
interface storageReadDataProps<T> {
  data?: T[];
  setState: setStateFunction<T>;
  id?: string;
  lastmod?: string;
}
interface storageSetSearchParamsOptionProps<T> {
  searchParams: URLSearchParams;
  loadValue?: LoadStateType;
  prefix?: string;
}
interface storageFetchDataProps<T>
  extends Omit<storageSetSearchParamsOptionProps<T>, "searchParams"> {
  src?: string;
  apiOrigin?: string;
}