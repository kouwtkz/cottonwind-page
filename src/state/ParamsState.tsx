import { create } from "zustand";
import { KeyValueStringType } from "../types/ValueType";
import { useLocation } from "react-router-dom";
import React from "react";

export interface ParamsStateType {
  search?: URLSearchParams;
  query: KeyValueStringType;
  searchSet: (str: string) => void;
}

export const useParamsState = create<ParamsStateType>((set) => ({
  query: {},
  searchSet(str) {
    const search = new URLSearchParams(str);
    const query = Object.fromEntries(search);
    set({ search, query });
  },
}));

export function ParamsState() {
  const { search } = useLocation();
  const searchSet = useParamsState((state) => state.searchSet);
  React.useLayoutEffect(() => {
    searchSet(search);
  }, [search]);
  return <></>;
}
