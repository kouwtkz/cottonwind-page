import { create } from "zustand";
import { KeyValueStringType } from "../types/ValueType";
import { useLocation } from "react-router-dom";
import { useLayoutEffect } from "react";

export interface ParamsStateType {
  search: string;
  searchParams: URLSearchParams;
  query: KeyValueStringType;
  pathname: string;
  hash: string;
  state: any;
  key: string;
  searchSet: (str: string) => void;
  pathnameSet: (str: string) => void;
  hashSet: (str: string) => void;
  stateSet: (str: any) => void;
  keySet: (str: string) => void;
}

export const useParamsState = create<ParamsStateType>((set) => ({
  search: "",
  searchParams: new URLSearchParams(),
  query: {},
  pathname: "",
  hash: "",
  state: null,
  key: "",
  searchSet(search) {
    const searchParams = new URLSearchParams(search);
    const query = Object.fromEntries(searchParams);
    set({ search, searchParams, query });
  },
  pathnameSet(pathname) {
    set({ pathname });
  },
  hashSet(hash) {
    set({ hash });
  },
  stateSet(state) {
    set({ state });
  },
  keySet(key) {
    set({ key });
  },
}));

export function ParamsState() {
  const v = useLocation();
  const { searchSet, pathnameSet, hashSet, stateSet, keySet } =
    useParamsState();
  useLayoutEffect(() => {
    searchSet(v.search);
  }, [v.search]);
  useLayoutEffect(() => {
    pathnameSet(v.pathname);
  }, [v.pathname]);
  useLayoutEffect(() => {
    hashSet(v.hash);
  }, [v.hash]);
  useLayoutEffect(() => {
    stateSet(v.state);
  }, [v.state]);
  useLayoutEffect(() => {
    keySet(v.key);
  }, [v.key]);
  return <></>;
}
