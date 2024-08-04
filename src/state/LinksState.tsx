import { useEffect, useRef } from "react";
import { useCookies } from "react-cookie";
import { create, StoreApi, UseBoundStore } from "zustand";

type LinksStateType = {
  list?: SiteLink[];
  setList: (list: SiteLink[]) => void;
};

export function createLinksState() {
  return create<LinksStateType>((set) => ({
    setList(list) {
      set({ list });
    },
  }));
}

export class LinksStateClass {
  url: string;
  use: UseBoundStore<StoreApi<LinksStateType>>;
  constructor(url: string) {
    this.url = url;
    this.use = createLinksState();
  }
  State() {
    const { setList } = this.use();
    useEffect(() => {
      fetch(this.url)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setList(data);
        });
    }, [this.url]);
    return <></>;
  }
}
