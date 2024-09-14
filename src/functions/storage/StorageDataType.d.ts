interface storageReadDataProps<T> {
  data?: T[];
  setAtom: (args_0: SetStateAction<T[] | undefined>) => void;
  id?: string;
  lastmod?: string;
}
interface storageSetSearchParamsOptionProps<T> {
  searchParams: URLSearchParams;
  loadAtomValue?: LoadAtomType;
  prefix?: string;
}
interface storageFetchDataProps<T>
  extends Omit<storageSetSearchParamsOptionProps<T>, "searchParams"> {
  src?: string;
  apiOrigin?: string;
}