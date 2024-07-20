import { HTMLAttributes, useEffect, useRef } from "react";
import { useCookies } from "react-cookie";
import { create, StoreApi, UseBoundStore } from "zustand";

export interface ThemeChangeButtonProps
  extends HTMLAttributes<HTMLDivElement> {}

type ThemeStateType = {
  index: number;
  list: string[];
  theme: string;
  setIndex: (index: number) => void;
  next: () => void;
  prev: () => void;
};

export function createThemeState(list: string[]) {
  return create<ThemeStateType>((set) => ({
    index: -1,
    list,
    theme: "",
    setIndex: (index) => {
      set((state) => {
        return { index, theme: state.list[index] || "" };
      });
    },
    next: () => {
      set((state) => {
        let index = state.index + 1;
        if (index >= state.list.length) index = -1;
        return { index, theme: state.list[index] || "" };
      });
    },
    prev: () => {
      set((state) => {
        let index = state.index - 1;
        if (index < -1) index = state.list.length - 1;
        return { index, theme: state.list[index] || "" };
      });
    },
  }));
}

export class ThemeStateClass {
  themes: string[];
  cookieKey: string;
  use: UseBoundStore<StoreApi<ThemeStateType>>;
  constructor(cookieKey: string, themes: string[]) {
    this.cookieKey = cookieKey;
    this.themes = themes;
    this.use = createThemeState(this.themes);
  }
  State() {
    const { index, theme, list, setIndex } = this.use();
    const [cookies, setCookie, removeCookie] = useCookies([this.cookieKey]);
    const isSet = useRef(false);
    const refIndex = useRef(-1);
    useEffect(() => {
      if (isSet.current) {
        if (refIndex.current !== index) {
          if (refIndex.current >= 0) {
            document.documentElement.classList.remove(list[refIndex.current]);
          }
          if (index >= 0) {
            document.documentElement.classList.add(theme);
            setCookie(this.cookieKey, theme, { maxAge: 34e6, path: "/" });
          } else {
            removeCookie(this.cookieKey, { path: "/" });
          }
          refIndex.current = index;
        }
      } else {
        isSet.current = true;
        if (cookies[this.cookieKey]) {
          document?.documentElement.classList.add(cookies[this.cookieKey]);
          const cookieIndex = list.findIndex(
            (v) => v === cookies[this.cookieKey]
          );
          setIndex(cookieIndex);
          refIndex.current = cookieIndex;
        }
      }
    });
    return <></>;
  }
}
