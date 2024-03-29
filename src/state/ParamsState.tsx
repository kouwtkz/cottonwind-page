import { create } from "zustand";
import { KeyValueStringType } from "../types/ValueType";
import { useLocation } from "react-router-dom";
import { useLayoutEffect } from "react";

export interface ParamsStateType {
  search: URLSearchParams;
  query: KeyValueStringType;
  pathname: string;
  hash: string;
  searchSet: (str: string) => void;
  pathnameSet: (str: string) => void;
  hashSet: (str: string) => void;
}

export const useParamsState = create<ParamsStateType>((set) => ({
  search: new URLSearchParams(),
  query: {},
  pathname: "",
  hash: "",
  searchSet(str) {
    const search = new URLSearchParams(str);
    const query = Object.fromEntries(search);
    set({ search, query });
  },
  pathnameSet(pathname) {
    set({ pathname });
  },
  hashSet(hash) {
    set({ hash });
  },
}));

export function ParamsState() {
  const { search, pathname, hash } = useLocation();
  const { searchSet, pathnameSet, hashSet } = useParamsState();
  useLayoutEffect(() => {
    searchSet(search);
  }, [search]);
  useLayoutEffect(() => {
    pathnameSet(pathname);
  }, [pathname]);
  useLayoutEffect(() => {
    hashSet(hash);
  }, [hash]);
  return <></>;
}
